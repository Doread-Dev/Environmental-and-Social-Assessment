// Role lists used by the user model and by requireRole() in the routes.

const ROLES = [
  "admin",
  "environmental_specialist",
  "program_manager",
  "project_manager",
  "environmental_focal_point",
  "viewer",
];

// Create/update domain data (projects, screenings, assessments, SEMP, monitoring) and submit.
const EDITOR_ROLES = [
  "admin",
  "environmental_specialist",
  "program_manager",
  "project_manager",
  "environmental_focal_point",
];

// Approve/reject screenings & assessments, delete/archive/restore projects, register users.
const SPECIALIST_ROLES = ["admin", "environmental_specialist"];

// Permanently delete archived projects, read the audit log (D60).
const ADMIN_ROLES = ["admin"];

module.exports = { ROLES, EDITOR_ROLES, SPECIALIST_ROLES, ADMIN_ROLES };
