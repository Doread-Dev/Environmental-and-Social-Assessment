const Screening = require("../models/screening.model");
const ApiError = require("../utils/ApiError");
const assertSameProject = require("../utils/assertSameProject");
const { applyTransition } = require("../utils/statusTransition");

const POPULATE = [
  { path: "project" },
  { path: "approved_by", populate: { path: "job_title" } },
  { path: "reject_by", populate: { path: "job_title" } },
  { path: "officer", populate: { path: "job_title" } },
];

const listScreenings = async () => Screening.find().populate(POPULATE);

const getScreening = async (id) => {
  const screening = await Screening.findById(id).populate(POPULATE);
  if (!screening) throw new ApiError(404, "Screening not found");
  return screening;
};

const getByProject = async (projectId) => {
  const screening = await Screening.findOne({ project: projectId }).populate(POPULATE);
  if (!screening) throw new ApiError(404, "Screening not found for project");
  return screening;
};

const createScreening = async (payload, createdBy) => {
  const screeningData = { ...payload };
  if (createdBy) {
    screeningData.officer = createdBy;
  }
  const created = await Screening.create(screeningData);
  return Screening.findById(created._id).populate(POPULATE);
};

const updateScreening = async (id, payload, updatedBy) => {
  const screening = await Screening.findById(id);
  if (!screening) throw new ApiError(404, "Screening not found");
  assertSameProject(screening, payload);

  const updateData = { ...payload };
  if (updatedBy && !screening.officer) {
    updateData.officer = updatedBy;
  }

  const updated = await Screening.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate(POPULATE);
  if (!updated) throw new ApiError(404, "Screening not found");
  return updated;
};

const transition = async (id, action, userId, options) => {
  const updated = await applyTransition(Screening, id, action, userId, options);
  return updated.populate(POPULATE);
};

const submitScreening = async (id, submittedBy) => transition(id, "submit", submittedBy);

const approveScreening = async (id, approvedBy, recommendations) =>
  transition(id, "approve", approvedBy, { recommendations });

const rejectScreening = async (id, rejectBy, rejectReason = null) =>
  transition(id, "reject", rejectBy, { rejectReason });

module.exports = {
  listScreenings,
  getScreening,
  getByProject,
  createScreening,
  updateScreening,
  submitScreening,
  approveScreening,
  rejectScreening,
};
