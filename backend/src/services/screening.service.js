const Screening = require("../models/screening.model");
const ApiError = require("../utils/ApiError");

const listScreenings = async () =>
  Screening.find().populate("project approved_by");

const getScreening = async (id) => {
  const screening = await Screening.findById(id).populate(
    "project approved_by"
  );
  if (!screening) throw new ApiError(404, "Screening not found");
  return screening;
};

const getByProject = async (projectId) => {
  const screening = await Screening.findOne({ project: projectId }).populate(
    "project approved_by"
  );
  if (!screening) throw new ApiError(404, "Screening not found for project");
  return screening;
};

const createScreening = async (payload) => Screening.create(payload);

const updateScreening = async (id, payload) => {
  const updated = await Screening.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new ApiError(404, "Screening not found");
  return updated;
};

const setStatus = async (id, status, approvedBy, recommendations = null) => {
  const updateData = {
    status,
    approved_by: approvedBy,
  };

  // إضافة recommendations فقط في حالة الموافقة
  if (status === "approved" && recommendations) {
    updateData.recommendations = recommendations;
  }

  const updated = await Screening.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("project approved_by");

  if (!updated) throw new ApiError(404, "Screening not found");
  return updated;
};

const approveScreening = async (id, approvedBy, recommendations) => {
  return setStatus(id, "approved", approvedBy, recommendations);
};

const rejectScreening = async (id, approvedBy) => {
  return setStatus(id, "rejected", approvedBy, null);
};

module.exports = {
  listScreenings,
  getScreening,
  getByProject,
  createScreening,
  updateScreening,
  setStatus, 
  approveScreening,
  rejectScreening, 
};
