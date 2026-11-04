const AuditLog = require("../models/auditLog.model");
const Project = require("../models/project.model");

// The critical-actions log (D65). record() is the only writer of AuditLog; v3's full activity
// log builds on the same entries.

// Never stored, whatever a caller passes: passwords (temporary ones included), hashes, tokens.
const SECRET_KEY = /password|token|hash|secret/i;

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;

const scrub = (value) => {
  if (Array.isArray(value)) return value.map(scrub);
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SECRET_KEY.test(key))
      .map(([key, inner]) => [key, scrub(inner)])
  );
};

/**
 * Records a critical action, after it succeeded. `user` is the signed-in user (req.user); name
 * and role are copied, as are the project title and target label, so the entry survives a
 * project delete/purge and a user deactivation.
 *
 * A failed write is logged on the server and does not fail the request (the action already
 * happened; phase 11 puts both in one transaction). With `required: true` it throws instead,
 * for an entry written before an action that must not happen without it (project purge, D60).
 *
 * @param {{_id, name, role}} user
 * @param {string} action one of AUDIT_ACTIONS
 * @param {{project?: {_id, title}|null, target: {type: string, id?, label?: string},
 *   snapshot?: object|null, details?: object|null}} entry
 * @param {{required?: boolean}} [options]
 */
const record = async (
  user,
  action,
  { project = null, target, snapshot = null, details = null },
  { required = false } = {}
) => {
  try {
    return await AuditLog.create({
      action,
      by: user._id,
      by_name: user.name,
      by_role: user.role,
      project: project?._id ?? null,
      project_title: project?.title ?? null,
      target_type: target.type,
      target_id: target.id ?? null,
      target_label: target.label ?? null,
      snapshot: scrub(snapshot),
      details: scrub(details),
    });
  } catch (err) {
    console.error(`Audit log: could not record ${action}:`, err.message);
    if (required) throw err;
    return null;
  }
};

// Tools 3/4 bulk saves (D65): one entry per save that deleted rows, with the serial number and
// description of each. A save that deletes nothing writes nothing.
const recordRemovedRows = async (user, action, projectId, removed, target) => {
  if (removed.length === 0) return null;
  const project = await Project.findById(projectId).select("title").lean();
  return record(user, action, {
    project,
    target: { type: target.type, id: null, label: target.label },
    snapshot: {
      rows: removed.map((row) => ({
        _id: row._id,
        serial_number: row.serial_number ?? null,
        description: row[target.descriptionField] ?? null,
      })),
    },
    details: { removed: removed.length },
  });
};

// GET /audit-logs (admin): newest first, paginated; `action` is an action or a prefix such as
// "user." (validated against the known ones), `from` / `to` are inclusive bounds.
const listEntries = async ({ page, limit, action, from, to }) => {
  const filter = {};
  if (action) {
    filter.action = action.endsWith(".") ? { $regex: `^${action.replace(/\./g, "\\.")}` } : action;
  }
  if (from || to) {
    filter.createdAt = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
  }

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);
  return {
    items,
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  };
};

module.exports = { record, recordRemovedRows, listEntries, scrub };
