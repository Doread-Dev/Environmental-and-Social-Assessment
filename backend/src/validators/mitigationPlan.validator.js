const Joi = require("joi");
const { text } = require("./text.validator");
const { tableVersion } = require("./version.validator");

// One table row (the project comes from the URL).
const rowSchema = Joi.object({
  _id: Joi.string().hex().length(24).optional(),
  serial_number: Joi.number().optional(),
  output_description: text().required(),
  potential_impact_and_significance: text().allow("", null),
  mitigation_and_enhancement_measures: text().allow("", null),
  monitoring: text().allow("", null),
  schedule: text().allow("", null),
  responsible: Joi.string().allow("", null).optional(),
  responsible_text: text().allow("", null).optional(),
  notes: text().allow("", null),
});

// PUT /projects/:id/mitigation: the whole table. A row with `_id` updates that row. `version` =
// the table's revision the client loaded (D62).
const replaceMitigationPlansSchema = Joi.object({
  version: tableVersion,
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
