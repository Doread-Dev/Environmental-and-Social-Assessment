const express = require("express");
const controller = require("../controllers/project.controller");
const managementController = require("../controllers/managementActivity.controller");
const mitigationController = require("../controllers/mitigationPlan.controller");
const monitoringController = require("../controllers/monitoring.controller");
const fileController = require("../controllers/projectFile.controller");
const validate = require("../middlewares/validate");
const { singleFile } = require("../middlewares/upload");
const { requirePermission } = require("../middlewares/auth");
const projectAccess = require("../middlewares/projectAccess");
const { listFilesQuerySchema, uploadFileSchema } = require("../validators/projectFile.validator");
const {
  createProjectSchema,
  updateProjectSchema,
  listProjectsQuerySchema,
} = require("../validators/project.validator");
const { replaceManagementActivitiesSchema } = require("../validators/managementActivity.validator");
const { replaceMitigationPlansSchema } = require("../validators/mitigationPlan.validator");
const { upsertMonitoringSchema } = require("../validators/monitoring.validator");

const router = express.Router();
const project = projectAccess.fromParam("id");

router.get(
  "/",
  validate(listProjectsQuerySchema, "query"),
  projectAccess.list(),
  controller.getAll
);
router.get("/:id", project, controller.getOne);
router.get("/:id/workspace", project, controller.getWorkspace);
// No project yet: creating one is a permission, not project access.
router.post(
  "/",
  requirePermission("project.create"),
  validate(createProjectSchema),
  controller.create
);
router.put(
  "/:id",
  requirePermission("project.edit"),
  project,
  validate(updateProjectSchema),
  controller.update
);
router.delete("/:id", requirePermission("project.delete"), project, controller.remove);
router.patch("/:id/archive", requirePermission("project.archive"), project, controller.archive);
router.patch("/:id/restore", requirePermission("project.restore"), project, controller.restore);
router.delete("/:id/purge", requirePermission("project.purge"), project, controller.purge);

// Bulk saves of the table-style tools (D32).
router.put(
  "/:id/management",
  requirePermission("semp.edit"),
  project,
  validate(replaceManagementActivitiesSchema),
  managementController.replaceForProject
);
router.put(
  "/:id/mitigation",
  requirePermission("semp.edit"),
  project,
  validate(replaceMitigationPlansSchema),
  mitigationController.replaceForProject
);
router.put(
  "/:id/monitoring",
  requirePermission("monitoring.edit"),
  project,
  validate(upsertMonitoringSchema),
  monitoringController.upsertForProject
);

// Project files (D47): Annex A–H; area semp_record answers 404 until v3 (D48).
router.get("/:id/files", project, validate(listFilesQuerySchema, "query"), fileController.list);
router.post(
  "/:id/files",
  requirePermission("files.edit"),
  project,
  singleFile("file"),
  validate(uploadFileSchema),
  fileController.upload
);

module.exports = router;
