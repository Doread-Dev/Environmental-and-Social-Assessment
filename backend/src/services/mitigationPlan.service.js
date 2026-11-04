const MitigationPlan = require("../models/mitigationPlan.model");
const replaceProjectRows = require("../utils/replaceProjectRows");
const { requireAssessmentApproved } = require("./workflow.service");
const { recordRemovedRows } = require("./audit.service");

const listByProject = async (projectId) =>
  MitigationPlan.find({ project: projectId })
    .populate("project responsible")
    .sort({ serial_number: 1, createdAt: -1 });

// The whole Tool 4 table in one request (D32); returns the saved table. Rows the save deletes
// are recorded in the audit log (D65).
const replaceForProject = async (projectId, rows, user) => {
  await requireAssessmentApproved(projectId);
  const removed = await replaceProjectRows(MitigationPlan, projectId, rows);
  await recordRemovedRows(user, "mitigation.rows_removed", projectId, removed, {
    type: "mitigation_plan",
    label: "Mitigation plan (Tool 4)",
    descriptionField: "output_description",
  });
  return listByProject(projectId);
};

module.exports = {
  listByProject,
  replaceForProject,
};
