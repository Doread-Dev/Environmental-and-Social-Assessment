const { ROLES, EDITOR_ROLES, SPECIALIST_ROLES, ADMIN_ROLES } = require("./roles");

// The only place that maps roles to what they may do (D35, D66). Routes name a permission
// (requirePermission in middlewares/auth.js), services ask can(user, name); nothing else lists
// roles. v3 replaces this map with per-user capabilities without touching routes or services.

// General permissions, returned by GET /auth/me; per-project `allowed_actions` add the workflow
// state on top (workflow.service allowedActions).
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

// Action permissions checked by routes and allowed_actions, each granted by one general
// permission above. Named like the allowed actions, so a route and the button that calls it ask
// the same question.
const ACTION_PERMISSIONS = {
  "project.create": "create_project",
  "project.edit": "edit",
  "project.delete": "delete_project",
  "project.archive": "archive_project",
  "project.restore": "archive_project",
  "project.purge": "purge_project",
  "screening.create": "edit",
  "screening.edit": "edit",
  "screening.submit": "edit",
  "screening.approve": "approve",
  "screening.reject": "approve",
  "assessment.create": "edit",
  "assessment.edit": "edit",
  "assessment.submit": "edit",
  "assessment.approve": "approve",
  "assessment.reject": "approve",
  "semp.edit": "edit",
  "monitoring.edit": "edit",
  "files.edit": "edit",
};

const isPermission = (name) =>
  Object.hasOwn(PERMISSIONS, name) || Object.hasOwn(ACTION_PERMISSIONS, name);

// Whether the user may do `name` (a general or an action permission). An unknown name is a
// programming error, not a "no".
const can = (user, name) => {
  if (!isPermission(name)) throw new Error(`Unknown permission "${name}"`);
  const general = ACTION_PERMISSIONS[name] ?? name;
  return Boolean(user) && PERMISSIONS[general].includes(user.role);
};

// The general permissions of the user (GET /auth/me).
const permissionsFor = (user) =>
  user && ROLES.includes(user.role)
    ? Object.keys(PERMISSIONS).filter((name) => can(user, name))
    : [];

module.exports = { PERMISSIONS, ACTION_PERMISSIONS, isPermission, can, permissionsFor };
