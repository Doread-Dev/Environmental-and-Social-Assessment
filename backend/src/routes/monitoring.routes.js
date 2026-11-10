const express = require("express");
const controller = require("../controllers/monitoring.controller");
const projectAccess = require("../middlewares/projectAccess");
const MonitoringRecord = require("../models/monitoringRecord.model");

const router = express.Router();

// Records are saved with PUT /projects/:id/monitoring (D32).
router.get("/project/:projectId", projectAccess.fromParam("projectId"), controller.getByProject);
router.get(
  "/:id",
  projectAccess.fromRecord(MonitoringRecord, "id", "Monitoring record not found"),
  controller.getOne
);

module.exports = router;
