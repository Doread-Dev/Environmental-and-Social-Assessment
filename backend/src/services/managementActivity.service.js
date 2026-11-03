const ManagementActivity = require("../models/managementActivity.model");
const ApiError = require("../utils/ApiError");
const assertSameProject = require("../utils/assertSameProject");
const normalizeResponsible = require("../utils/responsible");
const replaceProjectRows = require("../utils/replaceProjectRows");
const { requireAssessmentApproved } = require("./workflow.service");

const listByProject = async (projectId) =>
  ManagementActivity.find({ project: projectId })
    .populate("project responsible")
    .sort({ serial_number: 1, createdAt: -1 });

const createActivity = async (payload) => {
  await requireAssessmentApproved(payload.project);
  return ManagementActivity.create(normalizeResponsible(payload));
};

const updateActivity = async (id, payload) => {
  const existing = await ManagementActivity.findById(id);
  if (!existing) throw new ApiError(404, "Management activity not found");
  assertSameProject(existing, payload);
  await requireAssessmentApproved(existing.project);

  const updated = await ManagementActivity.findByIdAndUpdate(id, normalizeResponsible(payload), {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new ApiError(404, "Management activity not found");
  return updated;
};

const deleteActivity = async (id) => {
  const activity = await ManagementActivity.findById(id);
  if (!activity) throw new ApiError(404, "Management activity not found");
  await requireAssessmentApproved(activity.project);
  await activity.deleteOne();
  return true;
};

// The whole Tool 3 table in one request (D32); returns the saved table.
const replaceForProject = async (projectId, rows) => {
  await requireAssessmentApproved(projectId);
  await replaceProjectRows(ManagementActivity, projectId, rows);
  return listByProject(projectId);
};

module.exports = {
  listByProject,
  replaceForProject,
  createActivity,
  updateActivity,
  deleteActivity,
};
