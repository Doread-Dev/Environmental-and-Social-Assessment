const Joi = require("joi");

// One table row (the project comes from the URL).
const rowSchema = Joi.object({
  _id: Joi.string().hex().length(24).optional(),
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

// PUT /projects/:id/management: the whole table. A row with `_id` updates that row.
const replaceManagementActivitiesSchema = Joi.object({
  rows: Joi.array()
    .items(
      rowSchema.keys({
        project: Joi.any().strip(),
      })
    )
    .required(),
});

module.exports = {
  replaceManagementActivitiesSchema,
};
