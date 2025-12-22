const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  job_title: Joi.string().optional(),
  role: Joi.string()
    .valid(
      "environmental_specialist",
      "program_manager",
      "project_manager",
      "environmental_focal_point",
      "viewer"
    )
    .optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

module.exports = {
  registerSchema,
  loginSchema,
};

