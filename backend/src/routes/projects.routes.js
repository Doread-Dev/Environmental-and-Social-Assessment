const express = require("express");
const controller = require("../controllers/project.controller");
const validate = require("../middlewares/validate");
const { createProjectSchema, updateProjectSchema } = require("../validators/project.validator");
const { auth, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.post(
  "/",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager"),
  validate(createProjectSchema),
  controller.create
);
router.put(
  "/:id",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager"),
  validate(updateProjectSchema),
  controller.update
);
router.delete(
  "/:id",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager"),
  controller.remove
);

module.exports = router;

