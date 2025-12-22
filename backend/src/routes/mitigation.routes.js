const express = require("express");
const controller = require("../controllers/mitigationPlan.controller");
const validate = require("../middlewares/validate");
const {
  createMitigationPlanSchema,
  updateMitigationPlanSchema,
} = require("../validators/mitigationPlan.validator");

const router = express.Router();

router.get("/project/:projectId", controller.listByProject);
router.post("/", validate(createMitigationPlanSchema), controller.create);
router.put("/:id", validate(updateMitigationPlanSchema), controller.update);
router.delete("/:id", controller.remove);

module.exports = router;

