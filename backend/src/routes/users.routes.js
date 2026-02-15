const express = require("express");
const controller = require("../controllers/user.controller");
const { auth, requireRole } = require("../middlewares/auth");

const router = express.Router();

// Allow all roles including viewer (viewer can list users)
router.get(
  "/",
  auth,
  requireRole(
    "environmental_specialist",
    "program_manager",
    "project_manager",
    "environmental_focal_point",
    "viewer"
  ),
  controller.getAll
);

module.exports = router;

