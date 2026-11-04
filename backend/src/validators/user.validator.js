const Joi = require("joi");
const { ROLES } = require("../config/roles");

// A job title id, or null / "" to clear it.
const jobTitle = Joi.string().hex().length(24).allow(null, "");

// No password here: the server generates a temporary one (D22).
const createUserSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().trim().email().required(),
  role: Joi.string()
    .valid(...ROLES)
    .required(),
  job_title: jobTitle.optional(),
});

// Name, role and job title (D21). Email, password and is_active have their own paths.
const updateUserSchema = Joi.object({
  name: Joi.string().trim(),
  role: Joi.string().valid(...ROLES),
  job_title: jobTitle,
}).min(1);

module.exports = {
  createUserSchema,
  updateUserSchema,
};
