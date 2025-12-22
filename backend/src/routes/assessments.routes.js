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

const router = express.Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.get("/project/:projectId", controller.getByProject);
router.post("/", validate(createAssessmentSchema), controller.create);
router.put("/:id", validate(updateAssessmentSchema), controller.update);
router.post("/:id/methods", validate(addMethodSchema), controller.addMethod);
router.post("/:id/consultations", validate(addConsultationSchema), controller.addConsultation);
router.post("/:id/scores", validate(addScoresSchema), controller.addScores);
router.patch("/:id/calculate", controller.calculate);

module.exports = router;

