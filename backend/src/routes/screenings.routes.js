const express = require("express");
const controller = require("../controllers/screening.controller");
const validate = require("../middlewares/validate");
const {
  createScreeningSchema,
  updateScreeningSchema,
  approveScreeningSchema,
  rejectScreeningSchema,
} = require("../validators/screening.validator");
const { auth, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.get("/project/:projectId", controller.getByProject);
router.post(
  "/",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager", "environmental_focal_point"),
  validate(createScreeningSchema),
  controller.create
);
router.put(
  "/:id",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager", "environmental_focal_point"),
  validate(updateScreeningSchema),
  controller.update
);
router.patch(
  "/:id/approve",
  auth,
  requireRole("environmental_specialist"),
  validate(approveScreeningSchema),
  controller.approve
);
router.patch(
  "/:id/reject",
  auth,
  requireRole("environmental_specialist"),
  validate(rejectScreeningSchema),
  controller.reject
);

module.exports = router;

