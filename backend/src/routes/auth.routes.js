const express = require("express");
const controller = require("../controllers/auth.controller");
const validate = require("../middlewares/validate");
const { auth } = require("../middlewares/auth");
const { loginLimiter } = require("../middlewares/rateLimiter");
const { loginSchema, changePasswordSchema } = require("../validators/auth.validator");

const router = express.Router();

// No open registration (D7): admins create users with POST /users; the first admin comes from
// scripts/create-admin.js.
router.post("/login", loginLimiter, validate(loginSchema), controller.login);
// The signed-in user and what their role may do (D35). Reachable during a forced password change.
router.get("/me", auth, controller.me);
// Change own password (D23). Reachable during a forced password change (D22).
router.put("/password", auth, validate(changePasswordSchema), controller.changePassword);

module.exports = router;
