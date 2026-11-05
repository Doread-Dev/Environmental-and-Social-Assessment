const express = require("express");
const controller = require("../controllers/screening.controller");
const validate = require("../middlewares/validate");
const {
  createScreeningSchema,
  updateScreeningSchema,
  approveScreeningSchema,
  rejectScreeningSchema,
} = require("../validators/screening.validator");
const { submitSchema } = require("../validators/version.validator");
const { requirePermission } = require("../middlewares/auth");
const projectAccess = require("../middlewares/projectAccess");
const Screening = require("../models/screening.model");

const router = express.Router();
const screening = projectAccess.fromRecord(Screening, "id", "Screening not found");

router.get("/:id", screening, controller.getOne);
router.get("/project/:projectId", projectAccess.fromParam("projectId"), controller.getByProject);
router.post(
  "/",
  requirePermission("screening.create"),
  validate(createScreeningSchema),
  projectAccess.fromBody("project"),
  controller.create
);
router.put(
  "/:id",
  requirePermission("screening.edit"),
  validate(updateScreeningSchema),
  screening,
  controller.update
);
router.patch(
  "/:id/submit",
  requirePermission("screening.submit"),
  validate(submitSchema),
  screening,
  controller.submit
);
router.patch(
  "/:id/approve",
  requirePermission("screening.approve"),
  validate(approveScreeningSchema),
  screening,
  controller.approve
);
router.patch(
  "/:id/reject",
  requirePermission("screening.reject"),
  validate(rejectScreeningSchema),
  screening,
  controller.reject
);

module.exports = router;
