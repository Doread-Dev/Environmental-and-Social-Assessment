const express = require("express");
const controller = require("../controllers/projectFile.controller");
const validate = require("../middlewares/validate");
const { updateFileSchema } = require("../validators/projectFile.validator");
const { requirePermission } = require("../middlewares/auth");
const projectAccess = require("../middlewares/projectAccess");
const ProjectFile = require("../models/projectFile.model");

// Single files of the project file module (D47). Listing and upload live under /projects/:id/files.
const router = express.Router();
const file = projectAccess.fromRecord(ProjectFile, "fileId", "File not found");

router.get("/:fileId/download", file, controller.download);
router.delete("/:fileId", requirePermission("files.edit"), file, controller.remove);
router.patch(
  "/:fileId",
  requirePermission("files.edit"),
  validate(updateFileSchema),
  file,
  controller.update
);

module.exports = router;
