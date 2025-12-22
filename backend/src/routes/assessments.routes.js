const express = require("express");
const controller = require("../controllers/assessment.controller");
const validate = require("../middlewares/validate");
const {
  createAssessmentSchema,
  updateAssessmentSchema,
  addMethodSchema,
  addConsultationSchema,
  addScoresSchema,
} = require("../validators/assessment.validator");
const { auth, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.get("/project/:projectId", controller.getByProject);
router.post(
  "/",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager"),
  validate(createAssessmentSchema),
  controller.create
);
router.put(
  "/:id",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager"),
  validate(updateAssessmentSchema),
  controller.update
);
router.post(
  "/:id/methods",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager"),
  validate(addMethodSchema),
  controller.addMethod
);
router.post(
  "/:id/consultations",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager"),
  validate(addConsultationSchema),
  controller.addConsultation
);
router.post(
  "/:id/scores",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager"),
  validate(addScoresSchema),
  controller.addScores
);
router.patch(
  "/:id/calculate",
  auth,
  requireRole("environmental_specialist", "program_manager"),
  controller.calculate
);

module.exports = router;

