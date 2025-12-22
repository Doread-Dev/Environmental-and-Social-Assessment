const ManagementActivity = require("../models/managementActivity.model");
const ApiError = require("../utils/ApiError");

const listByProject = async (projectId) =>
  ManagementActivity.find({ project: projectId })
    .populate("project responsible")
    .sort({ serial_number: 1, createdAt: -1 });

const createActivity = async (payload) => ManagementActivity.create(payload);

const updateActivity = async (id, payload) => {
  const updated = await ManagementActivity.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new ApiError(404, "Management activity not found");
  return updated;
};

const deleteActivity = async (id) => {
  const activity = await ManagementActivity.findById(id);
  if (!activity) throw new ApiError(404, "Management activity not found");
  await activity.deleteOne();
  return true;
};

module.exports = {
  listByProject,
  createActivity,
  updateActivity,
  deleteActivity,
};
