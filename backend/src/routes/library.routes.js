const express = require("express");
const controller = require("../controllers/library.controller");
const validate = require("../middlewares/validate");
const { singleFile } = require("../middlewares/upload");
const { requirePermission } = require("../middlewares/auth");
const {
  createLibraryDocumentSchema,
  updateLibraryDocumentSchema,
  listLibraryQuerySchema,
} = require("../validators/library.validator");

// Reference library (D64 b): organisation guidance, not project-scoped (no project-access check).
// Every signed-in role reads and opens documents; managing them is `manage_library`.
const router = express.Router();
const manage = requirePermission("manage_library");

router.get("/", validate(listLibraryQuerySchema, "query"), controller.list);
router.get("/:id/file", controller.file);
router.post(
  "/",
  manage,
  // Room for a long description in the multipart fields.
  singleFile("file", { fieldSize: 16 * 1024 }),
  validate(createLibraryDocumentSchema),
  controller.create
);
router.patch("/:id", manage, validate(updateLibraryDocumentSchema), controller.update);
router.put("/:id/file", manage, singleFile("file"), controller.replaceFile);
router.delete("/:id", manage, controller.remove);

module.exports = router;
