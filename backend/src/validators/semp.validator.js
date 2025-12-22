const Joi = require("joi");

const createObjectiveSchema = Joi.object({
  project: Joi.string().required(),
  objective_text: Joi.string().required(),
});

const updateObjectiveSchema = createObjectiveSchema.fork("project", (s) => s.optional());

const createTargetSchema = Joi.object({
  objective: Joi.string().required(),
  target_text: Joi.string().required(),
});

const updateTargetSchema = createTargetSchema.fork("objective", (s) => s.optional());

const createActionSchema = Joi.object({
  target: Joi.string().required(),
  action_text: Joi.string().required(),
  responsible: Joi.string().optional(),
  resources: Joi.string().allow("", null),
  due_date: Joi.date().optional(),
});

const updateActionSchema = createActionSchema.fork("target", (s) => s.optional());

module.exports = {
  createObjectiveSchema,
  updateObjectiveSchema,
  createTargetSchema,
  updateTargetSchema,
  createActionSchema,
  updateActionSchema,
};

