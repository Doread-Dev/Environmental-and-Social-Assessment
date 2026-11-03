const Joi = require("joi");

const createManagementActivitySchema = Joi.object({
  project: Joi.string().required(),
  serial_number: Joi.number().optional(),
  activity_description: Joi.string().required(),
  potential_impact: Joi.string().allow("", null).optional(),
  recommended_actions: Joi.alternatives()
    .try(Joi.string(), Joi.array().items(Joi.string()))
    .optional(),
  monitoring_requirements: Joi.string().allow("", null),
  responsible: Joi.string().allow("", null).optional(),
  responsible_text: Joi.string().allow("", null).optional(),
  notes: Joi.string().allow("", null),
});

const updateManagementActivitySchema = createManagementActivitySchema.fork(
  ["project", "activity_description"],
  (schema) => schema.optional()
);

// PUT /projects/:id/management: the whole table. A row with `_id` updates that row.
const replaceManagementActivitiesSchema = Joi.object({
  rows: Joi.array()
    .items(
      createManagementActivitySchema.keys({
        _id: Joi.string().hex().length(24).optional(),
        project: Joi.any().strip(),
      })
    )
    .required(),
});

module.exports = {
  createManagementActivitySchema,
  updateManagementActivitySchema,
  replaceManagementActivitiesSchema,
};
