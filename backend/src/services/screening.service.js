const Screening = require("../models/screening.model");
const ApiError = require("../utils/ApiError");

const listScreenings = async () =>
  Screening.find().populate([
    { path: "project" },
    { path: "approved_by", populate: { path: "job_title" } },
    { path: "reject_by", populate: { path: "job_title" } },
    { path: "officer", populate: { path: "job_title" } },
  ]);

const getScreening = async (id) => {
  const screening = await Screening.findById(id).populate([
    { path: "project" },
    { path: "approved_by", populate: { path: "job_title" } },
    { path: "reject_by", populate: { path: "job_title" } },
    { path: "officer", populate: { path: "job_title" } },
  ]);
  if (!screening) throw new ApiError(404, "Screening not found");
  return screening;
};

const getByProject = async (projectId) => {
  const screening = await Screening.findOne({ project: projectId }).populate([
    { path: "project" },
    { path: "approved_by", populate: { path: "job_title" } },
    { path: "reject_by", populate: { path: "job_title" } },
    { path: "officer", populate: { path: "job_title" } },
  ]);
  if (!screening) throw new ApiError(404, "Screening not found for project");
  return screening;
};

const createScreening = async (payload, createdBy) => {
  const screeningData = { ...payload };
  if (createdBy) {
    screeningData.officer = createdBy;
  }
  const created = await Screening.create(screeningData);
  return Screening.findById(created._id).populate([
    { path: "project" },
    { path: "approved_by", populate: { path: "job_title" } },
    { path: "reject_by", populate: { path: "job_title" } },
    { path: "officer", populate: { path: "job_title" } },
  ]);
};

const updateScreening = async (id, payload, updatedBy) => {
  // إذا كان status يتغير إلى submitted أو لم يكن officer موجوداً، نحدّث officer
  const screening = await Screening.findById(id);
  if (!screening) throw new ApiError(404, "Screening not found");
  
  const updateData = { ...payload };
  
  // إذا تغير status إلى submitted أو لم يكن officer موجوداً، نحدّث officer
  if (updatedBy && (payload.status === "submitted" || !screening.officer)) {
    updateData.officer = updatedBy;
  }
  
  const updated = await Screening.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate([
    { path: "project" },
    { path: "approved_by", populate: { path: "job_title" } },
    { path: "reject_by", populate: { path: "job_title" } },
    { path: "officer", populate: { path: "job_title" } },
  ]);
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
    updateData.reject_reason = rejectReason ?? "";
  }

  const updated = await Screening.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate([
    { path: "project" },
    { path: "approved_by", populate: { path: "job_title" } },
    { path: "reject_by", populate: { path: "job_title" } },
    { path: "officer", populate: { path: "job_title" } },
  ]);

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
