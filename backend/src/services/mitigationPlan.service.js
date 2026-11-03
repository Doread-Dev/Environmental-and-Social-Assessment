const MitigationPlan = require("../models/mitigationPlan.model");
const replaceProjectRows = require("../utils/replaceProjectRows");
const { requireAssessmentApproved } = require("./workflow.service");

const listByProject = async (projectId) =>
  MitigationPlan.find({ project: projectId })
    .populate("project responsible")
    .sort({ serial_number: 1, createdAt: -1 });

// The whole Tool 4 table in one request (D32); returns the saved table.
const replaceForProject = async (projectId, rows) => {
  await requireAssessmentApproved(projectId);
  await replaceProjectRows(MitigationPlan, projectId, rows);
  return listByProject(projectId);
};

module.exports = {
  listByProject,
  replaceForProject,
};
