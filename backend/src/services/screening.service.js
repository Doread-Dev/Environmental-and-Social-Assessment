const Screening = require("../models/screening.model");
const ApiError = require("../utils/ApiError");

const listScreenings = async () =>
  Screening.find().populate("project approved_by reject_by");

const getScreening = async (id) => {
  const screening = await Screening.findById(id).populate(
    "project approved_by reject_by"
  );
  if (!screening) throw new ApiError(404, "Screening not found");
  return screening;
};

const getByProject = async (projectId) => {
  const screening = await Screening.findOne({ project: projectId }).populate(
    "project approved_by reject_by"
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

const setStatus = async (id, status, approvedBy, recommendations = null, rejectReason = null) => {
  const updateData = {
    status,
  };

  // في حالة الموافقة: تسجيل approved_by و recommendations
  if (status === "approved") {
    updateData.approved_by = approvedBy;
    if (recommendations) {
      updateData.recommendations = recommendations;
    }
  }

  // في حالة الرفض: تسجيل reject_by و reject_reason فقط
  if (status === "rejected") {
    updateData.reject_by = approvedBy;
    if (rejectReason) {
      updateData.reject_reason = rejectReason;
    }
  }

  const updated = await Screening.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("project approved_by reject_by");

  if (!updated) throw new ApiError(404, "Screening not found");
  return updated;
};

const approveScreening = async (id, approvedBy, recommendations) => {
  return setStatus(id, "approved", approvedBy, recommendations, null);
};

const rejectScreening = async (id, rejectBy, rejectReason = null) => {
  return setStatus(id, "rejected", rejectBy, null, rejectReason);
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
