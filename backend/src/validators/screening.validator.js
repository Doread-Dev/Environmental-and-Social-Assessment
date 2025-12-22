const Joi = require("joi");

const createScreeningSchema = Joi.object({
  project: Joi.string().required(),
  category_code: Joi.string().valid("A", "B", "C", "D", "E", "F").required(),
  category_reason: Joi.string().required(),
  potential_negative: Joi.string().allow("", null),
  potential_positive: Joi.string().allow("", null),
  approved_by: Joi.string().optional(),
  recommendations: Joi.string().allow("", null),
  screening_date: Joi.date().optional(),
  status: Joi.string().valid("draft", "submitted", "approved", "rejected").optional(),
});

const updateScreeningSchema = createScreeningSchema.fork(
  ["project", "category_code", "category_reason"],
  (schema) => schema.optional()
);

module.exports = {
  createScreeningSchema,
  updateScreeningSchema,
};

