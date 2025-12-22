const express = require("express");

const projectsRoutes = require("./projects.routes");
const screeningsRoutes = require("./screenings.routes");
const assessmentsRoutes = require("./assessments.routes");
const monitoringRoutes = require("./monitoring.routes");
const managementRoutes = require("./management.routes");
const mitigationRoutes = require("./mitigation.routes");
const sempRoutes = require("./semp.routes");
const reportsRoutes = require("./reports.routes");
const lookupsRoutes = require("./lookups.routes");
const attachmentsRoutes = require("./attachments.routes");
const authRoutes = require("./auth.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/projects", projectsRoutes);
router.use("/screenings", screeningsRoutes);
router.use("/assessments", assessmentsRoutes);
router.use("/monitoring", monitoringRoutes);
router.use("/management", managementRoutes);
router.use("/mitigation", mitigationRoutes);
router.use("/semp", sempRoutes);
router.use("/reports", reportsRoutes);
router.use("/lookups", lookupsRoutes);
router.use("/attachments", attachmentsRoutes);

module.exports = router;
