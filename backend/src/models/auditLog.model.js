const mongoose = require("mongoose");

// Who did what to which record, for actions that leave nothing else behind (D60).
// Only `project.purge` for now; the full field-level change log is v3 (D16).
const AUDIT_ACTIONS = ["project.purge"];

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, enum: AUDIT_ACTIONS, required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    target_type: { type: String, enum: ["project"], required: true },
    target_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    // Copied, not referenced: the target no longer exists after a purge.
    target_title: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
module.exports.AUDIT_ACTIONS = AUDIT_ACTIONS;
