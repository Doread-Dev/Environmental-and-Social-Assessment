const Joi = require("joi");

const createManagementActivitySchema = Joi.object({
  project: Joi.string().required(),
  serial_number: Joi.number().optional(),
  activity_description: Joi.string().required(),
  potential_impact: Joi.string().allow("", null).optional(),
  recommended_actions: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
  monitoring_requirements: Joi.string().allow("", null),
  responsible: Joi.string().optional(),
  notes: Joi.string().allow("", null),
});

const updateManagementActivitySchema = createManagementActivitySchema.fork(
  ["project", "activity_description"],
  (schema) => schema.optional()
);

module.exports = {
  createManagementActivitySchema,
  updateManagementActivitySchema,
};

