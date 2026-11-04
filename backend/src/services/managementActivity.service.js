const ManagementActivity = require("../models/managementActivity.model");
const replaceProjectRows = require("../utils/replaceProjectRows");
const { requireAssessmentApproved } = require("./workflow.service");
const { recordRemovedRows } = require("./audit.service");

const listByProject = async (projectId) =>
  ManagementActivity.find({ project: projectId })
    .populate("project responsible")
    .sort({ serial_number: 1, createdAt: -1 });

// The whole Tool 3 table in one request (D32); returns the saved table. Rows the save deletes
// are recorded in the audit log (D65).
const replaceForProject = async (projectId, rows, user) => {
  await requireAssessmentApproved(projectId);
  const removed = await replaceProjectRows(ManagementActivity, projectId, rows);
  await recordRemovedRows(user, "management.rows_removed", projectId, removed, {
    type: "management_activity",
    label: "Management activities (Tool 3)",
    descriptionField: "activity_description",
  });
  return listByProject(projectId);
};

module.exports = {
  listByProject,
  replaceForProject,
};
