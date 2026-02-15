const express = require("express");
const controller = require("../controllers/semp.controller");
const validate = require("../middlewares/validate");
const {
  createObjectiveSchema,
  updateObjectiveSchema,
  createTargetSchema,
  updateTargetSchema,
  createActionSchema,
  updateActionSchema,
} = require("../validators/semp.validator");
const { auth, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.get("/project/:projectId", controller.getPlan);
router.post(
  "/objectives",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager", "environmental_focal_point"),
  validate(createObjectiveSchema),
  controller.createObjective
);
router.put(
  "/objectives/:id",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager", "environmental_focal_point"),
  validate(updateObjectiveSchema),
  controller.updateObjective
);

router.post(
  "/targets",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager", "environmental_focal_point"),
  validate(createTargetSchema),
  controller.createTarget
);
router.put(
  "/targets/:id",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager", "environmental_focal_point"),
  validate(updateTargetSchema),
  controller.updateTarget
);

router.post(
  "/actions",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager", "environmental_focal_point"),
  validate(createActionSchema),
  controller.createAction
);
router.put(
  "/actions/:id",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager", "environmental_focal_point"),
  validate(updateActionSchema),
  controller.updateAction
);

module.exports = router;
