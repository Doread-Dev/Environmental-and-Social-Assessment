const mongoose = require("mongoose");
const MonitoringRecord = require("../models/monitoringRecord.model");
const Indicator = require("../models/indicator.model");
const ApiError = require("../utils/ApiError");
const assertSameProject = require("../utils/assertSameProject");
const normalizeResponsible = require("../utils/responsible");
const validationMessage = require("../utils/validationMessage");
const { requireSempComplete } = require("./workflow.service");

const listMonitoring = async () =>
  MonitoringRecord.find().populate("project indicator responsible").sort({ createdAt: -1 });

const getMonitoringRecord = async (id) => {
  const record = await MonitoringRecord.findById(id).populate("project indicator responsible");
  if (!record) throw new ApiError(404, "Monitoring record not found");
  return record;
};

const getByProject = async (projectId) =>
  MonitoringRecord.find({ project: projectId }).populate("project indicator responsible");

const createRecord = async (payload) => {
  await requireSempComplete(payload.project);
  if (await MonitoringRecord.exists({ project: payload.project, indicator: payload.indicator })) {
    throw new ApiError(
      409,
      "A monitoring record already exists for this indicator in this project"
    );
  }
  const record = await MonitoringRecord.create(normalizeResponsible(payload));
  // Populate relations before returning (consistent with other methods)
  await record.populate("project indicator responsible");
  return record;
};

const updateRecord = async (id, payload) => {
  const existing = await MonitoringRecord.findById(id);
  if (!existing) throw new ApiError(404, "Monitoring record not found");
  assertSameProject(existing, payload);
  await requireSempComplete(existing.project);

  const updated = await MonitoringRecord.findByIdAndUpdate(id, normalizeResponsible(payload), {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new ApiError(404, "Monitoring record not found");

  // Populate relations before returning (consistent with other methods)
  await updated.populate("project indicator responsible");
  return updated;
};

const updateQuarter = async (id, quarterKey, value) => {
  const record = await MonitoringRecord.findById(id);
  if (!record) throw new ApiError(404, "Monitoring record not found");
  await requireSempComplete(record.project);

  if (!["baseline", "Q1", "Q2", "Q3", "Q4"].includes(quarterKey)) {
    throw new ApiError(400, "Invalid quarter key");
  }

  record.scores = record.scores || {};
  record.scores[quarterKey] = value; // value الآن String

  // لا يتم حساب total تلقائياً - سيتم إرساله من الفرونت

  await record.save();

  // Populate relations before returning (consistent with other methods)
  await record.populate("project indicator responsible");
  return record;
};

const recordError = (index, message) => new ApiError(400, `Record ${index + 1}: ${message}`);

// All of a project's monitoring records in one request (D32), upserted by indicator: a record
// for an indicator that has none yet is created, otherwise that record is updated. Records left
// out stay as they are. Values stay free text (D19). Every record is checked before the first
// write, so an invalid one leaves everything untouched.
const upsertForProject = async (projectId, records) => {
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
  if (prepared.length > 0) {
    await MonitoringRecord.bulkWrite(
      prepared.map(({ indicator, ...fields }) => ({
        updateOne: {
          filter: { project, indicator: new mongoose.Types.ObjectId(indicator) },
          update: { $set: fields },
          upsert: true,
        },
      }))
    );
  }
  return getByProject(projectId);
};

module.exports = {
  listMonitoring,
  upsertForProject,
  getMonitoringRecord,
  getByProject,
  createRecord,
  updateRecord,
  updateQuarter,
};
