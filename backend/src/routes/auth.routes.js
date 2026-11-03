const express = require("express");
const controller = require("../controllers/auth.controller");
const validate = require("../middlewares/validate");
const { auth, requireRole } = require("../middlewares/auth");
const { loginLimiter } = require("../middlewares/rateLimiter");
const { registerSchema, loginSchema } = require("../validators/auth.validator");
const { SPECIALIST_ROLES } = require("../config/roles");

const router = express.Router();

// No open first-user registration (D7): the first admin is created with scripts/create-admin.js.
router.post(
  "/register",
  auth,
  requireRole(...SPECIALIST_ROLES),
  validate(registerSchema),
  controller.register
);
router.post("/login", loginLimiter, validate(loginSchema), controller.login);
// The signed-in user and what their role may do (D35).
router.get("/me", auth, controller.me);

module.exports = router;
