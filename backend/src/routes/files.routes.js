const express = require("express");
const controller = require("../controllers/projectFile.controller");
const validate = require("../middlewares/validate");
const { updateFileSchema } = require("../validators/projectFile.validator");
const { requireRole } = require("../middlewares/auth");
const { EDITOR_ROLES } = require("../config/roles");

// Single files of the project file module (D47). Listing and upload live under /projects/:id/files.
const router = express.Router();

router.get("/:fileId/download", controller.download);
router.delete("/:fileId", requireRole(...EDITOR_ROLES), controller.remove);
router.patch(
  "/:fileId",
  requireRole(...EDITOR_ROLES),
  validate(updateFileSchema),
  controller.update
);

module.exports = router;
