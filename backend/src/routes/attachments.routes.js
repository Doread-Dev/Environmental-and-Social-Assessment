const express = require("express");
const controller = require("../controllers/attachment.controller");
const validate = require("../middlewares/validate");
const { createAttachmentSchema } = require("../validators/attachment.validator");
const upload = require("../middlewares/upload");
const { auth, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.post(
  "/",
  auth,
  requireRole("environmental_specialist", "program_manager", "project_manager"),
  validate(createAttachmentSchema),
  controller.create
);
router.get("/:id", controller.getOne);
router.post(
  "/upload",
  auth,
  requireRole(
    "environmental_specialist",
    "program_manager",
    "project_manager",
    "environmental_focal_point"
  ),
  upload.single("file"),
  controller.upload
);

module.exports = router;

