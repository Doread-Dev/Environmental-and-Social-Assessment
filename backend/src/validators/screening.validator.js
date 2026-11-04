const Joi = require("joi");

const createScreeningSchema = Joi.object({
  project: Joi.string().required(),
  category_code: Joi.string().valid("A", "B", "C", "D", "E", "F").required(),
  category_reason: Joi.string().required(),
  potential_negative: Joi.string().allow("", null),
  potential_positive: Joi.string().allow("", null),
  screening_date: Joi.date().optional(),
  // status, officer, approved_by, reject_by, reject_reason and recommendations (the approver's
  // field, D63 a) are server-owned: set only by the submit/approve/reject endpoints, stripped
  // from create/update bodies.
});

const updateScreeningSchema = createScreeningSchema.fork(
  ["project", "category_code", "category_reason"],
  (schema) => schema.optional()
);

const approveScreeningSchema = Joi.object({
  recommendations: Joi.string().allow("", null).optional(),
});

const rejectScreeningSchema = Joi.object({
  reject_reason: Joi.string().allow("", null).optional(),
});

module.exports = {
  createScreeningSchema,
  updateScreeningSchema,
  approveScreeningSchema,
  rejectScreeningSchema,
};
