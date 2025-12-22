const express = require("express");
const controller = require("../controllers/screening.controller");
const validate = require("../middlewares/validate");
const { createScreeningSchema, updateScreeningSchema } = require("../validators/screening.validator");
const { auth, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.get("/project/:projectId", controller.getByProject);
router.post(
  "/",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager"),
  validate(createScreeningSchema),
  controller.create
);
router.put(
  "/:id",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager"),
  validate(updateScreeningSchema),
  controller.update
);
router.patch(
  "/:id/approve",
  auth,
  requireRole("environmental_specialist", "program_manager"),
  controller.approve
);
router.patch(
  "/:id/reject",
  auth,
  requireRole("environmental_specialist", "program_manager"),
  controller.reject
);

module.exports = router;

