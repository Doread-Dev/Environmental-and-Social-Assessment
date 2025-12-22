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

const router = express.Router();

router.get("/project/:projectId", controller.getPlan);
router.post("/objectives", validate(createObjectiveSchema), controller.createObjective);
router.put("/objectives/:id", validate(updateObjectiveSchema), controller.updateObjective);

router.post("/targets", validate(createTargetSchema), controller.createTarget);
router.put("/targets/:id", validate(updateTargetSchema), controller.updateTarget);

router.post("/actions", validate(createActionSchema), controller.createAction);
router.put("/actions/:id", validate(updateActionSchema), controller.updateAction);

module.exports = router;

