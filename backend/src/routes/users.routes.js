const express = require("express");
const controller = require("../controllers/user.controller");
const validate = require("../middlewares/validate");
const { requireRole } = require("../middlewares/auth");
const { createUserSchema, updateUserSchema } = require("../validators/user.validator");
const { ADMIN_ROLES } = require("../config/roles");

const router = express.Router();

// Every signed-in role: admins get every account, others the active users for the pickers.
router.get("/", controller.getAll);

// User management is admin only (D21).
router.post("/", requireRole(...ADMIN_ROLES), validate(createUserSchema), controller.create);
router.put("/:id", requireRole(...ADMIN_ROLES), validate(updateUserSchema), controller.update);
router.patch("/:id/deactivate", requireRole(...ADMIN_ROLES), controller.deactivate);
router.patch("/:id/reactivate", requireRole(...ADMIN_ROLES), controller.reactivate);
router.post("/:id/reset-password", requireRole(...ADMIN_ROLES), controller.resetPassword);

module.exports = router;
