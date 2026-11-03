const Joi = require("joi");

// One table row (the project comes from the URL).
const rowSchema = Joi.object({
  _id: Joi.string().hex().length(24).optional(),
  serial_number: Joi.number().optional(),
  output_description: Joi.string().required(),
  potential_impact_and_significance: Joi.string().allow("", null),
  mitigation_and_enhancement_measures: Joi.string().allow("", null),
  monitoring: Joi.string().allow("", null),
  schedule: Joi.string().allow("", null),
  responsible: Joi.string().allow("", null).optional(),
  responsible_text: Joi.string().allow("", null).optional(),
  notes: Joi.string().allow("", null),
});

// PUT /projects/:id/mitigation: the whole table. A row with `_id` updates that row.
const replaceMitigationPlansSchema = Joi.object({
  rows: Joi.array()
    .items(
      rowSchema.keys({
        project: Joi.any().strip(),
      })
    )
    .required(),
});

module.exports = {
  replaceMitigationPlansSchema,
};
