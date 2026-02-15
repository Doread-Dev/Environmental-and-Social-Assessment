const express = require("express");
const controller = require("../controllers/managementActivity.controller");
const validate = require("../middlewares/validate");
const {
  createManagementActivitySchema,
  updateManagementActivitySchema,
} = require("../validators/managementActivity.validator");
const { auth, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.get("/project/:projectId", controller.listByProject);
router.post(
  "/",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager", "environmental_focal_point"),
  validate(createManagementActivitySchema),
  controller.create
);
router.put(
  "/:id",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager", "environmental_focal_point"),
  validate(updateManagementActivitySchema),
  controller.update
);
router.delete(
  "/:id",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager", "environmental_focal_point"),
  controller.remove
);

module.exports = router;
