const express = require("express");
const controller = require("../controllers/screening.controller");
const validate = require("../middlewares/validate");
const {
  createScreeningSchema,
  updateScreeningSchema,
  approveScreeningSchema,
  rejectScreeningSchema,
} = require("../validators/screening.validator");
const { requireRole } = require("../middlewares/auth");
const { EDITOR_ROLES, SPECIALIST_ROLES } = require("../config/roles");

const router = express.Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.get("/project/:projectId", controller.getByProject);
router.post("/", requireRole(...EDITOR_ROLES), validate(createScreeningSchema), controller.create);
router.put(
  "/:id",
  requireRole(...EDITOR_ROLES),
  validate(updateScreeningSchema),
  controller.update
);
router.patch("/:id/submit", requireRole(...EDITOR_ROLES), controller.submit);
router.patch(
  "/:id/approve",
  requireRole(...SPECIALIST_ROLES),
  validate(approveScreeningSchema),
  controller.approve
);
router.patch(
  "/:id/reject",
  requireRole(...SPECIALIST_ROLES),
  validate(rejectScreeningSchema),
  controller.reject
);

module.exports = router;
