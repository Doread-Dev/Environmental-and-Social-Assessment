const { ROLES, EDITOR_ROLES, SPECIALIST_ROLES, ADMIN_ROLES } = require("./roles");

// What each role may do in general (D35), built from the same role lists as requireRole() in the
// routes. GET /auth/me returns them; per-project `allowed_actions` add the workflow state on top.
const PERMISSIONS = {
  create_project: EDITOR_ROLES,
  edit: EDITOR_ROLES,
  export: EDITOR_ROLES, // every role except viewer (D28a)
  approve: SPECIALIST_ROLES,
  manage_users: ADMIN_ROLES, // D21: user management is admin only
  delete_project: SPECIALIST_ROLES,
  archive_project: SPECIALIST_ROLES,
  purge_project: ADMIN_ROLES,
  read_audit_log: ADMIN_ROLES,
};

const can = (role, permission) => PERMISSIONS[permission].includes(role);

const permissionsFor = (role) =>
  ROLES.includes(role) ? Object.keys(PERMISSIONS).filter((name) => can(role, name)) : [];

module.exports = { PERMISSIONS, can, permissionsFor };
