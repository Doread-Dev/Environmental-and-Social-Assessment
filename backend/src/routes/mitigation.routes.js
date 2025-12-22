const express = require("express");
const controller = require("../controllers/mitigationPlan.controller");
const validate = require("../middlewares/validate");
const {
  createMitigationPlanSchema,
  updateMitigationPlanSchema,
} = require("../validators/mitigationPlan.validator");
const { auth, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.get("/project/:projectId", controller.listByProject);
router.post(
  "/",
  auth,
  requireRole("environmental_specialist", "program_manager"),
  validate(createMitigationPlanSchema),
  controller.create
);
router.put(
  "/:id",
  auth,
  requireRole("environmental_specialist", "program_manager"),
  validate(updateMitigationPlanSchema),
  controller.update
);
router.delete(
  "/:id",
  auth,
  requireRole("environmental_specialist", "program_manager"),
  controller.remove
);

module.exports = router;

