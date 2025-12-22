const MitigationPlan = require("../models/mitigationPlan.model");
const ApiError = require("../utils/ApiError");

const listByProject = async (projectId) =>
  MitigationPlan.find({ project: projectId })
    .populate("project responsible")
    .sort({ serial_number: 1, createdAt: -1 });

const createPlan = async (payload) => MitigationPlan.create(payload);

const updatePlan = async (id, payload) => {
  const updated = await MitigationPlan.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new ApiError(404, "Mitigation plan item not found");
  return updated;
};

const deletePlan = async (id) => {
  const plan = await MitigationPlan.findById(id);
  if (!plan) throw new ApiError(404, "Mitigation plan item not found");
  await plan.deleteOne();
  return true;
};

module.exports = {
  listByProject,
  createPlan,
  updatePlan,
  deletePlan,
};
