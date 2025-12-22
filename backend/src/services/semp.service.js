const SempObjective = require("../models/sempObjective.model");
const SempTarget = require("../models/sempTarget.model");
const SempAction = require("../models/sempAction.model");
const ApiError = require("../utils/ApiError");

const listPlan = async (projectId) => {
  const objectives = await SempObjective.find({ project: projectId }).lean();
  const objectiveIds = objectives.map((o) => o._id);
  const targets = await SempTarget.find({
    objective: { $in: objectiveIds },
  }).lean();
  const targetIds = targets.map((t) => t._id);
  const actions = await SempAction.find({ target: { $in: targetIds } }).lean();
  return { objectives, targets, actions };
};

const createObjective = async (payload) => SempObjective.create(payload);

const updateObjective = async (id, payload) => {
  const updated = await SempObjective.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new ApiError(404, "Objective not found");
  return updated;
};

const createTarget = async (payload) => SempTarget.create(payload);

const updateTarget = async (id, payload) => {
  const updated = await SempTarget.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new ApiError(404, "Target not found");
  return updated;
};

const createAction = async (payload) => SempAction.create(payload);

const updateAction = async (id, payload) => {
  const updated = await SempAction.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new ApiError(404, "Action not found");
  return updated;
};

module.exports = {
  listPlan,
  createObjective,
  updateObjective,
  createTarget,
  updateTarget,
  createAction,
  updateAction,
};
