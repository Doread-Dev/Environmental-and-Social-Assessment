const Joi = require("joi");

const createMitigationPlanSchema = Joi.object({
  project: Joi.string().required(),
  serial_number: Joi.number().optional(),
  output_description: Joi.string().required(),
  potential_impact_and_significance: Joi.string().allow("", null),
  mitigation_and_enhancement_measures: Joi.string().allow("", null),
  monitoring: Joi.string().allow("", null),
  schedule: Joi.string().allow("", null),
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
