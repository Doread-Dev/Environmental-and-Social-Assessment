const express = require("express");
const controller = require("../controllers/assessment.controller");
const validate = require("../middlewares/validate");
const {
  createAssessmentSchema,
  updateAssessmentSchema,
  replaceMethodsSchema,
  replaceConsultationsSchema,
  addScoresSchema,
  approveAssessmentSchema,
  rejectAssessmentSchema,
} = require("../validators/assessment.validator");
const { requireRole } = require("../middlewares/auth");
const { EDITOR_ROLES, SPECIALIST_ROLES } = require("../config/roles");

const router = express.Router();

router.get("/:id", controller.getOne);
router.get("/project/:projectId", controller.getByProject);
router.post("/", requireRole(...EDITOR_ROLES), validate(createAssessmentSchema), controller.create);
router.put(
  "/:id",
  requireRole(...EDITOR_ROLES),
  validate(updateAssessmentSchema),
  controller.update
);
router.get("/:id/methods", controller.getMethods);
router.put(
  "/:id/methods",
  requireRole(...EDITOR_ROLES),
  validate(replaceMethodsSchema),
  controller.replaceMethods
);
router.get("/:id/consultations", controller.getConsultations);
router.put(
  "/:id/consultations",
  requireRole(...EDITOR_ROLES),
  validate(replaceConsultationsSchema),
  controller.replaceConsultations
);
router.post(
  "/:id/scores",
  requireRole(...EDITOR_ROLES),
  validate(addScoresSchema),
  controller.addScores
);
router.get("/:id/scores", controller.getScores);
router.patch("/:id/submit", requireRole(...EDITOR_ROLES), controller.submit);
router.patch(
  "/:id/approve",
  requireRole(...SPECIALIST_ROLES),
  validate(approveAssessmentSchema),
  controller.approve
);
router.patch(
  "/:id/reject",
  requireRole(...SPECIALIST_ROLES),
  validate(rejectAssessmentSchema),
  controller.reject
);

module.exports = router;
