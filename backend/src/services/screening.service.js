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

const setStatus = async (id, status) => {
  const updated = await Screening.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );
  if (!updated) throw new ApiError(404, "Screening not found");
  return updated;
};

module.exports = {
  listScreenings,
  getScreening,
  getByProject,
  createScreening,
  updateScreening,
  setStatus,
};
