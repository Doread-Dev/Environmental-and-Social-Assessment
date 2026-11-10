const express = require("express");
const { auth, requirePasswordChanged } = require("../middlewares/auth");

const projectsRoutes = require("./projects.routes");
const screeningsRoutes = require("./screenings.routes");
const assessmentsRoutes = require("./assessments.routes");
const monitoringRoutes = require("./monitoring.routes");
const managementRoutes = require("./management.routes");
const mitigationRoutes = require("./mitigation.routes");
const lookupsRoutes = require("./lookups.routes");
const authRoutes = require("./auth.routes");
const usersRoutes = require("./users.routes");
const auditLogsRoutes = require("./auditLogs.routes");
const dashboardRoutes = require("./dashboard.routes");
const filesRoutes = require("./files.routes");
const libraryRoutes = require("./library.routes");
const helpRoutes = require("./help.routes");

const router = express.Router();

// /auth handles its own auth (login is public, /me and /password need a token).
router.use("/auth", authRoutes);

// Everything below requires a valid token of an active user (D3) who has no pending forced
// password change (D22, 403 PASSWORD_CHANGE_REQUIRED). Routers add requirePermission() (D66b)
// and the project-access check (middlewares/projectAccess.js, D66a).
router.use(auth);
router.use(requirePasswordChanged);

router.use("/users", usersRoutes);
router.use("/projects", projectsRoutes);
router.use("/screenings", screeningsRoutes);
router.use("/assessments", assessmentsRoutes);
router.use("/monitoring", monitoringRoutes);
router.use("/management", managementRoutes);
router.use("/mitigation", mitigationRoutes);
router.use("/lookups", lookupsRoutes);
router.use("/audit-logs", auditLogsRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/files", filesRoutes);
router.use("/library", libraryRoutes);
router.use("/help", helpRoutes);

module.exports = router;
