const mongoose = require("mongoose");

// Critical-actions log (D65, D60): who did what, to which project and record. Append-only: only
// services/audit.service.js writes it, no endpoint edits or deletes entries. Names, titles and
// labels are copied, so an entry still reads correctly after a project is deleted or a user is
// deactivated. The full field-level log is v3 (D16).
const AUDIT_ACTIONS = [
  "project.delete",
  "project.purge",
  "project.archive",
  "project.restore",
  "file.delete",
  "management.rows_removed",
  "mitigation.rows_removed",
  "user.create",
  "user.role_change",
  "user.deactivate",
  "user.reactivate",
  "user.reset_password",
];

// The prefixes GET /audit-logs accepts as a filter ("user." → every user action).
const AUDIT_ACTION_PREFIXES = [...new Set(AUDIT_ACTIONS.map((a) => `${a.split(".")[0]}.`))];

const TARGET_TYPES = ["project", "file", "management_activity", "mitigation_plan", "user"];

const { ObjectId, Mixed } = mongoose.Schema.Types;

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, enum: AUDIT_ACTIONS, required: true },
    by: { type: ObjectId, ref: "User", required: true },
    by_name: { type: String, required: true },
    by_role: { type: String, required: true },
    project: { type: ObjectId, ref: "Project", default: null },
    project_title: { type: String, default: null },
    target_type: { type: String, enum: TARGET_TYPES, required: true },
    // null when the action touches several records (rows removed by a bulk save).
    target_id: { type: ObjectId, default: null },
    target_label: { type: String, default: null },
    // The target as it was (what was deleted, who the user was), and anything else worth keeping.
    snapshot: { type: Mixed, default: null },
    details: { type: Mixed, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    minimize: false,
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
module.exports.AUDIT_ACTIONS = AUDIT_ACTIONS;
module.exports.AUDIT_ACTION_PREFIXES = AUDIT_ACTION_PREFIXES;
module.exports.TARGET_TYPES = TARGET_TYPES;
