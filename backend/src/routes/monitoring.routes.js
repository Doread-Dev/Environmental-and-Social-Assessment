const express = require("express");
const controller = require("../controllers/monitoring.controller");
const validate = require("../middlewares/validate");
const {
  createMonitoringSchema,
  updateMonitoringSchema,
  updateQuarterSchema,
} = require("../validators/monitoring.validator");
const { requireRole } = require("../middlewares/auth");
const { EDITOR_ROLES } = require("../config/roles");

const router = express.Router();

router.get("/", controller.getAll);
router.get("/project/:projectId", controller.getByProject);
router.get("/:id", controller.getOne);
router.post("/", requireRole(...EDITOR_ROLES), validate(createMonitoringSchema), controller.create);
router.put(
  "/:id",
  requireRole(...EDITOR_ROLES),
  validate(updateMonitoringSchema),
  controller.update
);
router.patch(
  "/:id/quarter/:q",
  requireRole(...EDITOR_ROLES),
  validate(updateQuarterSchema),
  controller.updateQuarter
);

module.exports = router;
