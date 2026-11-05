const mongoose = require("mongoose");
const MonitoringRecord = require("../models/monitoringRecord.model");
const Indicator = require("../models/indicator.model");
const ApiError = require("../utils/ApiError");
const normalizeResponsible = require("../utils/responsible");
const validationMessage = require("../utils/validationMessage");
const { requireSempComplete } = require("./workflow.service");
const { assertCurrentRevision, getRevision, withRevision } = require("../utils/version");

const TABLE = "monitoring";

const getMonitoringRecord = async (id) => {
  const record = await MonitoringRecord.findById(id).populate("project indicator responsible");
  if (!record) throw new ApiError(404, "Monitoring record not found");
  return record;
};

const findRecords = (projectId) =>
  MonitoringRecord.find({ project: projectId }).populate("project indicator responsible");

// The records and the table's revision (D62): `{ records, version }`.
const getByProject = async (projectId) => {
  const [records, version] = await Promise.all([
    findRecords(projectId),
    getRevision(projectId, TABLE),
  ]);
  return { records, version };
};

const recordError = (index, message) => new ApiError(400, `Record ${index + 1}: ${message}`);

// All of a project's monitoring records in one request (D32), upserted by indicator: a record
// for an indicator that has none yet is created, otherwise that record is updated. Records left
// out stay as they are. Values stay free text (D19). Every record is checked before the first
// write, so an invalid one leaves everything untouched. `version` = the table's revision the
// client loaded: a stale one → 409 first; it is checked and raised in one conditional update
// right before the write (D62). Returns `{ records, version }` with the new revision.
const upsertForProject = async (projectId, { records, version }) => {
  await assertCurrentRevision(projectId, TABLE, version);
  await requireSempComplete(projectId);

  const indicatorIds = records.map((record) => record.indicator);
  const known = new Set(
    (
      await Indicator.find({ _id: { $in: indicatorIds } })
        .select("_id")
        .lean()
    ).map((i) => String(i._id))
  );
  const seen = new Set();
  const prepared = [];
  for (const [index, record] of records.entries()) {
    if (!known.has(record.indicator)) throw recordError(index, "unknown indicator");
    if (seen.has(record.indicator)) throw recordError(index, "indicator sent twice");
    seen.add(record.indicator);

    let fields;
    try {
      fields = normalizeResponsible(record);
      await new MonitoringRecord({ ...fields, project: projectId }).validate();
    } catch (err) {
      throw recordError(index, validationMessage(err));
    }
    prepared.push(fields);
  }

  const project = new mongoose.Types.ObjectId(String(projectId));
  const revision = await withRevision(projectId, TABLE, version, async () => {
    if (prepared.length === 0) return;
    await MonitoringRecord.bulkWrite(
      prepared.map(({ indicator, ...fields }) => ({
        updateOne: {
          filter: { project, indicator: new mongoose.Types.ObjectId(indicator) },
          update: { $set: fields },
          upsert: true,
        },
      }))
    );
  });
  return { records: await findRecords(projectId), version: revision };
};

module.exports = {
  upsertForProject,
  getMonitoringRecord,
  getByProject,
};
