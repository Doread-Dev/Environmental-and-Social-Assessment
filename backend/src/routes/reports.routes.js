const express = require("express");
const controller = require("../controllers/report.controller");
const { auth, requireRole } = require("../middlewares/auth");

const router = express.Router();

// Dashboard stats (read-only) - allow viewers and above
router.get(
  "/dashboard",
  auth,
  requireRole(
    "environmental_specialist",
    "program_manager",
    "project_manager",
    "environmental_focal_point",
    "viewer"
  ),
  controller.dashboard
);

// CSV export - restrict to environmental_specialist & program_manager
router.get(
  "/export",
  auth,
  requireRole("environmental_specialist", "program_manager"),
  controller.export
);

module.exports = router;

