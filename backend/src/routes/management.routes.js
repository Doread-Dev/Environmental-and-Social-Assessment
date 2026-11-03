const express = require("express");
const controller = require("../controllers/managementActivity.controller");
const validate = require("../middlewares/validate");
const {
  createManagementActivitySchema,
  updateManagementActivitySchema,
} = require("../validators/managementActivity.validator");
const { requireRole } = require("../middlewares/auth");
const { EDITOR_ROLES } = require("../config/roles");

const router = express.Router();

router.get("/project/:projectId", controller.listByProject);
router.post(
  "/",
  requireRole(...EDITOR_ROLES),
  validate(createManagementActivitySchema),
  controller.create
);
router.put(
  "/:id",
  requireRole(...EDITOR_ROLES),
  validate(updateManagementActivitySchema),
  controller.update
);
router.delete("/:id", requireRole(...EDITOR_ROLES), controller.remove);

module.exports = router;
