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
const { requirePermission } = require("../middlewares/auth");
const projectAccess = require("../middlewares/projectAccess");
const Assessment = require("../models/assessment.model");

const router = express.Router();
const assessment = projectAccess.fromRecord(Assessment, "id", "Assessment not found");
const edit = requirePermission("assessment.edit");

router.get("/:id", assessment, controller.getOne);
// The assessment with methods, consultations and scores embedded (D63 c); null = not started.
router.get("/project/:projectId", projectAccess.fromParam("projectId"), controller.getByProject);
router.post(
  "/",
  requirePermission("assessment.create"),
  validate(createAssessmentSchema),
  projectAccess.fromBody("project"),
  controller.create
);
router.put("/:id", edit, validate(updateAssessmentSchema), assessment, controller.update);
router.put(
  "/:id/methods",
  edit,
  validate(replaceMethodsSchema),
  assessment,
  controller.replaceMethods
);
router.put(
  "/:id/consultations",
  edit,
  validate(replaceConsultationsSchema),
  assessment,
  controller.replaceConsultations
);
router.post("/:id/scores", edit, validate(addScoresSchema), assessment, controller.addScores);
router.patch("/:id/submit", requirePermission("assessment.submit"), assessment, controller.submit);
router.patch(
  "/:id/approve",
  requirePermission("assessment.approve"),
  validate(approveAssessmentSchema),
  assessment,
  controller.approve
);
router.patch(
  "/:id/reject",
  requirePermission("assessment.reject"),
  validate(rejectAssessmentSchema),
  assessment,
  controller.reject
);

module.exports = router;
