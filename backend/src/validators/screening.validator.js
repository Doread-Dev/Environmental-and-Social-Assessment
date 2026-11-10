const Joi = require("joi");
const { recommendations, text } = require("./text.validator");
const { recordVersion } = require("./version.validator");

const createScreeningSchema = Joi.object({
  project: Joi.string().required(),
  category_code: Joi.string().valid("A", "B", "C", "D", "E", "F").required(),
  category_reason: text().required(),
  potential_negative: text().allow("", null),
  potential_positive: text().allow("", null),
  screening_date: Joi.date().optional(),
  // status, officer, approved_by, reject_by, reject_reason and recommendations (the approver's
  // field, D63 a) are server-owned: set only by the submit/approve/reject endpoints, stripped
  // from create/update bodies.
});

// The version the client loaded (its `updatedAt`) is required: a stale save → 409 (D62).
const updateScreeningSchema = createScreeningSchema
  .fork(["project", "category_code", "category_reason"], (schema) => schema.optional())
  .keys({ version: recordVersion });

const approveScreeningSchema = Joi.object({
  recommendations: recommendations(),
});

const rejectScreeningSchema = Joi.object({
  reject_reason: text().allow("", null).optional(),
});

module.exports = {
  createScreeningSchema,
  updateScreeningSchema,
  approveScreeningSchema,
  rejectScreeningSchema,
};
