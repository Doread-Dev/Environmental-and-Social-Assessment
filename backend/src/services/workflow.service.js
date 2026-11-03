const Project = require("../models/project.model");
const Screening = require("../models/screening.model");
const Assessment = require("../models/assessment.model");
const ManagementActivity = require("../models/managementActivity.model");
const MitigationPlan = require("../models/mitigationPlan.model");
const ApiError = require("../utils/ApiError");

// Workflow gates (D2, D12, D17). Every create/update/delete of project data calls one of these;
// reads never do. A broken workflow rule is a conflict with the project's state: 409.
// Order: Tool 1 Screening approved → Tool 2 Assessment approved → Tools 3 & 4 (SEMP) complete
// → Tool 5 Monitoring. Every screening category (A–F, including E) follows the same order.

// The project exists and is not archived (archived projects are read-only).
const assertProjectWritable = async (projectId) => {
  const project = await Project.findById(projectId).select("archived");
  if (!project) throw new ApiError(404, "Project not found");
  if (project.archived) {
    throw new ApiError(409, "This project is archived and read-only. Restore it to edit.");
  }
};

const requireScreeningApproved = async (projectId) => {
  await assertProjectWritable(projectId);
  if (!(await Screening.exists({ project: projectId, status: "approved" }))) {
    throw new ApiError(409, "Tool 1 (Screening) must be approved before Tool 2 (Assessment).");
  }
};

const requireAssessmentApproved = async (projectId) => {
  await assertProjectWritable(projectId);
  if (!(await Assessment.exists({ project: projectId, status: "approved" }))) {
    throw new ApiError(
      409,
      "Tool 2 (Assessment) must be approved before Tools 3 and 4 (Management Activities and Mitigation Plan)."
    );
  }
};

const hasText = (value) => typeof value === "string" && value.trim() !== "";

// Tools 3 and 4 are complete when each has at least one row and every row has its description.
const isSempComplete = async (projectId) => {
  const [activities, plans] = await Promise.all([
    ManagementActivity.find({ project: projectId }).select("activity_description"),
    MitigationPlan.find({ project: projectId }).select("output_description"),
  ]);
  return (
    activities.length > 0 &&
    plans.length > 0 &&
    activities.every((a) => hasText(a.activity_description)) &&
    plans.every((p) => hasText(p.output_description))
  );
};

const requireSempComplete = async (projectId) => {
  await requireAssessmentApproved(projectId);
  if (!(await isSempComplete(projectId))) {
    throw new ApiError(
      409,
      "Tools 3 and 4 must be complete (at least one row each, every row described) before Tool 5 (Monitoring)."
    );
  }
};

module.exports = {
  assertProjectWritable,
  requireScreeningApproved,
  requireAssessmentApproved,
  isSempComplete,
  requireSempComplete,
};
