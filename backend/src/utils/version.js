const mongoose = require("mongoose");
const ApiError = require("./ApiError");
const TableRevision = require("../models/tableRevision.model");
const { inTransaction } = require("./transaction");

// Stale saves (D62, D73): every write of project data carries the version the client loaded.
// Project, screening and assessment: the record's `updatedAt` (ISO string). Tools 3, 4 and
// Monitoring: a revision counter per project and table (`TableRevision`).
const STALE_VERSION = "STALE_VERSION";
const STALE_MESSAGE =
  "Someone else changed this since you opened it. Reload to see the latest version.";

const staleError = () => {
  const error = new ApiError(409, STALE_MESSAGE);
  error.code = STALE_VERSION;
  return error;
};

const sameVersion = (record, version) =>
  record?.updatedAt instanceof Date &&
  version instanceof Date &&
  record.updatedAt.getTime() === version.getTime();

// Throws the stale 409 when the record changed since the client loaded `version`.
const assertCurrentVersion = (record, version) => {
  if (!sameVersion(record, version)) throw staleError();
};

// The next `updatedAt`: never equal to the version it replaces, even within one millisecond, so a
// second save of the same version is always refused.
const nextUpdatedAt = (version) => new Date(Math.max(Date.now(), version.getTime() + 1));

// Conditional update of a record that only applies while it still has `version` (and matches
// `filter`). Returns the updated document, or null when it no longer matches; the caller decides
// which 409 to answer. Sets `updatedAt` itself (timestamps off) so the version always moves on.
const updateIfCurrent = (Model, filter, version, update, options = {}) => {
  const { $set = {}, ...rest } = update;
  return Model.findOneAndUpdate(
    { ...filter, updatedAt: version },
    { ...rest, $set: { ...$set, updatedAt: nextUpdatedAt(version) } },
    { new: true, runValidators: true, timestamps: false, ...options }
  );
};

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

// The current revision of a project's table (0 before its first save).
const getRevision = async (projectId, table) => {
  const row = await TableRevision.findOne({ project: toObjectId(projectId), table })
    .select("revision")
    .lean();
  return row?.revision ?? 0;
};

const assertCurrentRevision = async (projectId, table, revision) => {
  if ((await getRevision(projectId, table)) !== revision) throw staleError();
};

// Checks and raises the revision in one conditional update, so two saves of the same revision at
// the same moment cannot both pass. Returns the new revision; throws the stale 409.
const claimRevision = async (projectId, table, revision) => {
  try {
    const updated = await TableRevision.findOneAndUpdate(
      { project: toObjectId(projectId), table, revision },
      { $inc: { revision: 1 } },
      { new: true, upsert: true }
    );
    return updated.revision;
  } catch (err) {
    // No row with that revision while one exists for the table: the upsert hits the unique index.
    if (err?.code === 11000) throw staleError();
    throw err;
  }
};

// Gives a claimed revision back when the write after it failed, so the client's version stays
// valid (best effort: only while nobody claimed the next one).
const releaseRevision = async (projectId, table, claimed) => {
  try {
    await TableRevision.updateOne(
      { project: toObjectId(projectId), table, revision: claimed },
      { $inc: { revision: -1 } }
    );
  } catch (err) {
    console.error("Could not release a table revision:", err);
  }
};

// Runs `write` under a claimed revision; returns the new revision. In a transaction (phase 11) a
// failed write rolls the claim back with everything else; without one the claim is given back.
const withRevision = async (projectId, table, revision, write) => {
  const claimed = await claimRevision(projectId, table, revision);
  if (inTransaction()) {
    await write();
    return claimed;
  }
  try {
    await write();
  } catch (err) {
    await releaseRevision(projectId, table, claimed);
    throw err;
  }
  return claimed;
};

module.exports = {
  STALE_VERSION,
  STALE_MESSAGE,
  staleError,
  assertCurrentVersion,
  updateIfCurrent,
  nextUpdatedAt,
  getRevision,
  assertCurrentRevision,
  withRevision,
};
