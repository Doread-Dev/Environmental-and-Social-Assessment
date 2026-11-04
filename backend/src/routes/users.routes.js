const express = require("express");
const controller = require("../controllers/user.controller");
const validate = require("../middlewares/validate");
const { requirePermission } = require("../middlewares/auth");
const { createUserSchema, updateUserSchema } = require("../validators/user.validator");

const router = express.Router();

// Every signed-in role: admins get every account, others the active users for the pickers.
router.get("/", controller.getAll);

// User management is admin only (D21).
const manage = requirePermission("manage_users");
router.post("/", manage, validate(createUserSchema), controller.create);
router.put("/:id", manage, validate(updateUserSchema), controller.update);
router.patch("/:id/deactivate", manage, controller.deactivate);
router.patch("/:id/reactivate", manage, controller.reactivate);
router.post("/:id/reset-password", manage, controller.resetPassword);

module.exports = router;
