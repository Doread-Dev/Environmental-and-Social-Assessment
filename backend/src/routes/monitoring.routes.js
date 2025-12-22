const express = require("express");
const controller = require("../controllers/monitoring.controller");
const validate = require("../middlewares/validate");
const {
  createMonitoringSchema,
  updateMonitoringSchema,
  updateQuarterSchema,
} = require("../validators/monitoring.validator");

const router = express.Router();

router.get("/", controller.getAll);
router.get("/project/:projectId", controller.getByProject);
router.post("/", validate(createMonitoringSchema), controller.create);
router.put("/:id", validate(updateMonitoringSchema), controller.update);
router.patch("/:id/quarter/:q", validate(updateQuarterSchema), controller.updateQuarter);

module.exports = router;

