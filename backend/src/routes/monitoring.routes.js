const express = require("express");
const controller = require("../controllers/monitoring.controller");
const validate = require("../middlewares/validate");
const {
  createMonitoringSchema,
  updateMonitoringSchema,
  updateQuarterSchema,
} = require("../validators/monitoring.validator");
const { auth, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.get("/", controller.getAll);
router.get("/project/:projectId", controller.getByProject);
router.post(
  "/",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager"),
  validate(createMonitoringSchema),
  controller.create
);
router.put(
  "/:id",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager"),
  validate(updateMonitoringSchema),
  controller.update
);
router.patch(
  "/:id/quarter/:q",
  auth,
  requireRole(
    "environmental_specialist",
    "program_manager",
    "project_manager",
    "environmental_focal_point"
  ),
  validate(updateQuarterSchema),
  controller.updateQuarter
);

module.exports = router;

