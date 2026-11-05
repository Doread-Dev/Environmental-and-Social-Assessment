const Screening = require("../models/screening.model");
const ApiError = require("../utils/ApiError");
const assertSameProject = require("../utils/assertSameProject");
const { applyTransition, assertEditable, historyEntry } = require("../utils/statusTransition");
const { assertCurrentVersion, staleError, updateIfCurrent } = require("../utils/version");
const { assertProjectWritable } = require("./workflow.service");

const POPULATE = [
  { path: "project" },
  { path: "approved_by", populate: { path: "job_title" } },
  { path: "reject_by", populate: { path: "job_title" } },
  { path: "officer", populate: { path: "job_title" } },
  { path: "status_history.by", select: "name role" },
];

const getScreening = async (id) => {
  const screening = await Screening.findById(id).populate(POPULATE);
  if (!screening) throw new ApiError(404, "Screening not found");
  return screening;
};

// null when the project has no screening yet: "not started" is not an error (D34).
const getByProject = async (projectId) =>
  Screening.findOne({ project: projectId }).populate(POPULATE);

const createScreening = async (payload, createdBy) => {
  await assertProjectWritable(payload.project);
  if (await Screening.exists({ project: payload.project })) {
    throw new ApiError(409, "A screening already exists for this project");
  }

  const created = await Screening.create({
    ...payload,
    officer: createdBy,
    status_history: [historyEntry("created", createdBy)],
  });
  return Screening.findById(created._id).populate(POPULATE);
};

// `version` = the `updatedAt` the client loaded; a stale one → 409 STALE_VERSION (D62), checked
// first so a user whose screening was submitted or rejected meanwhile is told to reload.
const updateScreening = async (id, { version, ...payload }, updatedBy) => {
  const screening = await Screening.findById(id);
  if (!screening) throw new ApiError(404, "Screening not found");
  assertCurrentVersion(screening, version);
  assertSameProject(screening, payload);
  await assertProjectWritable(screening.project);
  assertEditable(screening);

  const updateData = { ...payload };
  if (updatedBy && !screening.officer) {
    updateData.officer = updatedBy;
  }

  const updated = await updateIfCurrent(Screening, { _id: id, status: screening.status }, version, {
    $set: updateData,
  });
  if (!updated) throw staleError();
  return updated.populate(POPULATE);
};

const transition = async (id, action, userId, options = {}) => {
  const screening = await Screening.findById(id).select("project updatedAt");
  if (!screening) throw new ApiError(404, "Screening not found");
  // Submit carries the version the user saw; approve/reject don't (the record is locked).
  if (options.version) assertCurrentVersion(screening, options.version);
  await assertProjectWritable(screening.project);

  const updated = await applyTransition(Screening, id, action, userId, options);
  return updated.populate(POPULATE);
};

const submitScreening = async (id, submittedBy, version) =>
  transition(id, "submit", submittedBy, { version });

const approveScreening = async (id, approvedBy, recommendations) =>
  transition(id, "approve", approvedBy, { recommendations });

const rejectScreening = async (id, rejectBy, rejectReason = null) =>
  transition(id, "reject", rejectBy, { rejectReason });

module.exports = {
  getScreening,
  getByProject,
  createScreening,
  updateScreening,
  submitScreening,
  approveScreening,
  rejectScreening,
};
