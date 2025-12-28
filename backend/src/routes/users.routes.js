const express = require("express");
const controller = require("../controllers/user.controller");
const { auth, requireRole } = require("../middlewares/auth");

const router = express.Router();

// Allowed for all roles except viewer
router.use(
  auth,
  requireRole(
    "environmental_specialist",
    "program_manager",
    "project_manager",
    "environmental_focal_point"
  )
);

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);

module.exports = router;

