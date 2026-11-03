const express = require("express");
const { auth } = require("../middlewares/auth");

const projectsRoutes = require("./projects.routes");
const screeningsRoutes = require("./screenings.routes");
const assessmentsRoutes = require("./assessments.routes");
const monitoringRoutes = require("./monitoring.routes");
const managementRoutes = require("./management.routes");
const mitigationRoutes = require("./mitigation.routes");
const lookupsRoutes = require("./lookups.routes");
const authRoutes = require("./auth.routes");
const usersRoutes = require("./users.routes");

const router = express.Router();

// /auth handles its own auth (login is public, register is protected).
router.use("/auth", authRoutes);

// Everything below requires a valid token of an active user (D3). Routers add requireRole().
router.use(auth);

router.use("/users", usersRoutes);
router.use("/projects", projectsRoutes);
router.use("/screenings", screeningsRoutes);
router.use("/assessments", assessmentsRoutes);
router.use("/monitoring", monitoringRoutes);
router.use("/management", managementRoutes);
router.use("/mitigation", mitigationRoutes);
router.use("/lookups", lookupsRoutes);

module.exports = router;
