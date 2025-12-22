const express = require("express");
const controller = require("../controllers/auth.controller");
const validate = require("../middlewares/validate");
const { auth, requireRole } = require("../middlewares/auth");
const { registerSchema, loginSchema } = require("../validators/auth.validator");
const User = require("../models/user.model");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Allow first-ever user to register without auth; afterwards require env specialist
const guardRegister = asyncHandler(async (req, res, next) => {
  const count = await User.countDocuments();
  if (count === 0) return next();
  return auth(req, res, (err) => {
    if (err) return next(err);
    return requireRole("environmental_specialist")(req, res, next);
  });
});

router.post(
  "/register",
  guardRegister,
  validate(registerSchema),
  controller.register
);
router.post("/login", validate(loginSchema), controller.login);

module.exports = router;
