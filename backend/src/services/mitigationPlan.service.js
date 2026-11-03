const MitigationPlan = require("../models/mitigationPlan.model");
const ApiError = require("../utils/ApiError");
const assertSameProject = require("../utils/assertSameProject");
const normalizeResponsible = require("../utils/responsible");
const { requireAssessmentApproved } = require("./workflow.service");

const listByProject = async (projectId) =>
  MitigationPlan.find({ project: projectId })
    .populate("project responsible")
    .sort({ serial_number: 1, createdAt: -1 });

const createPlan = async (payload) => {
  await requireAssessmentApproved(payload.project);
  return MitigationPlan.create(normalizeResponsible(payload));
};

const updatePlan = async (id, payload) => {
  const existing = await MitigationPlan.findById(id);
  if (!existing) throw new ApiError(404, "Mitigation plan item not found");
  assertSameProject(existing, payload);
  await requireAssessmentApproved(existing.project);

  const updated = await MitigationPlan.findByIdAndUpdate(id, normalizeResponsible(payload), {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new ApiError(404, "Mitigation plan item not found");
  return updated;
};

const deletePlan = async (id) => {
  const plan = await MitigationPlan.findById(id);
  if (!plan) throw new ApiError(404, "Mitigation plan item not found");
  await requireAssessmentApproved(plan.project);
  await plan.deleteOne();
  return true;
};

module.exports = {
  listByProject,
  createPlan,
  updatePlan,
  deletePlan,
};
