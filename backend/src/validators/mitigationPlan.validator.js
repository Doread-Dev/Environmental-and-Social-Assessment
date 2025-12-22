const Joi = require("joi");

const createMitigationPlanSchema = Joi.object({
  project: Joi.string().required(),
  serial_number: Joi.number().optional(),
  output_description: Joi.string().required(),
  environmental_impact: Joi.string().allow("", null),
  social_impact: Joi.string().allow("", null),
  climate_impact: Joi.string().allow("", null),
  impact_level: Joi.string().valid("low", "medium", "high").optional(),
  mitigation_measures: Joi.string().allow("", null),
  enhancement_measures: Joi.string().allow("", null),
  monitoring: Joi.string().allow("", null),
  schedule_before: Joi.string().allow("", null),
  schedule_during: Joi.string().allow("", null),
  schedule_after: Joi.string().allow("", null),
  is_continuous: Joi.boolean().optional(),
  responsible: Joi.string().optional(),
  notes: Joi.string().allow("", null),
});

const updateMitigationPlanSchema = createMitigationPlanSchema.fork(
  ["project", "output_description"],
  (schema) => schema.optional()
);

module.exports = {
  createMitigationPlanSchema,
  updateMitigationPlanSchema,
};

