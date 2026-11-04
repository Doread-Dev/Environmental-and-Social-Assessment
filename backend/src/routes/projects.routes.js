const express = require("express");
const controller = require("../controllers/project.controller");
const managementController = require("../controllers/managementActivity.controller");
const mitigationController = require("../controllers/mitigationPlan.controller");
const monitoringController = require("../controllers/monitoring.controller");
const fileController = require("../controllers/projectFile.controller");
const validate = require("../middlewares/validate");
const { singleFile } = require("../middlewares/upload");
const { listFilesQuerySchema, uploadFileSchema } = require("../validators/projectFile.validator");
const {
  createProjectSchema,
  updateProjectSchema,
  listProjectsQuerySchema,
} = require("../validators/project.validator");
const { replaceManagementActivitiesSchema } = require("../validators/managementActivity.validator");
const { replaceMitigationPlansSchema } = require("../validators/mitigationPlan.validator");
const { upsertMonitoringSchema } = require("../validators/monitoring.validator");
const { requireRole } = require("../middlewares/auth");
const { ADMIN_ROLES, EDITOR_ROLES, SPECIALIST_ROLES } = require("../config/roles");

const router = express.Router();

router.get("/", validate(listProjectsQuerySchema, "query"), controller.getAll);
router.get("/:id", controller.getOne);
router.get("/:id/workspace", controller.getWorkspace);
router.post("/", requireRole(...EDITOR_ROLES), validate(createProjectSchema), controller.create);
router.put("/:id", requireRole(...EDITOR_ROLES), validate(updateProjectSchema), controller.update);
router.delete("/:id", requireRole(...SPECIALIST_ROLES), controller.remove);
router.patch("/:id/archive", requireRole(...SPECIALIST_ROLES), controller.archive);
router.patch("/:id/restore", requireRole(...SPECIALIST_ROLES), controller.restore);
router.delete("/:id/purge", requireRole(...ADMIN_ROLES), controller.purge);

// Bulk saves of the table-style tools (D32).
router.put(
  "/:id/management",
  requireRole(...EDITOR_ROLES),
  validate(replaceManagementActivitiesSchema),
  managementController.replaceForProject
);
router.put(
  "/:id/mitigation",
  requireRole(...EDITOR_ROLES),
  validate(replaceMitigationPlansSchema),
  mitigationController.replaceForProject
);
router.put(
  "/:id/monitoring",
  requireRole(...EDITOR_ROLES),
  validate(upsertMonitoringSchema),
  monitoringController.upsertForProject
);

// Project files (D47): Annex A–H; area semp_record answers 404 until v3 (D48).
router.get("/:id/files", validate(listFilesQuerySchema, "query"), fileController.list);
router.post(
  "/:id/files",
  requireRole(...EDITOR_ROLES),
  singleFile("file"),
  validate(uploadFileSchema),
  fileController.upload
);

module.exports = router;
