const ManagementActivity = require("../models/managementActivity.model");
const replaceProjectRows = require("../utils/replaceProjectRows");
const { requireAssessmentApproved } = require("./workflow.service");
const { recordRemovedRows } = require("./audit.service");
const { assertCurrentRevision, getRevision } = require("../utils/version");
const { atomic } = require("../utils/transaction");

const TABLE = "management";

const findRows = (projectId) =>
  ManagementActivity.find({ project: projectId })
    .populate("project responsible")
    .sort({ serial_number: 1, createdAt: -1 });

// The table and its revision (D62): `{ rows, version }`.
const listByProject = async (projectId) => {
  const [rows, version] = await Promise.all([findRows(projectId), getRevision(projectId, TABLE)]);
  return { rows, version };
};

// The whole Tool 3 table in one request (D32); returns the saved table and its new revision.
// `version` is the revision the client loaded; a stale one → 409 before anything else (D62).
// Rows the save deletes are recorded in the audit log (D65), in the same transaction as the save
// when MongoDB supports one (phase 11): the save never happens without its entry.
const replaceForProject = async (projectId, { rows, version }, user) => {
  await assertCurrentRevision(projectId, TABLE, version);
  await requireAssessmentApproved(projectId);
  const revision = await atomic(async () => {
    const saved = await replaceProjectRows(ManagementActivity, projectId, rows, {
      table: TABLE,
      version,
    });
    await recordRemovedRows(user, "management.rows_removed", projectId, saved.removed, {
      type: "management_activity",
      label: "Management activities (Tool 3)",
      descriptionField: "activity_description",
    });
    return saved.revision;
  });
  return { rows: await findRows(projectId), version: revision };
};

module.exports = {
  listByProject,
  replaceForProject,
};
