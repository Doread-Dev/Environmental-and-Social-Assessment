const Joi = require("joi");

// Password policy is security, not a text-length rule, so D57 does not remove it (phase 3).
// GET /auth/me returns it as `password_rules` so the frontend doesn't keep its own copy (D35).
const PASSWORD_MIN_LENGTH = 6;
const password = Joi.string().min(PASSWORD_MIN_LENGTH);

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: password.required(),
});

module.exports = {
  PASSWORD_MIN_LENGTH,
  password,
  loginSchema,
  changePasswordSchema,
};
