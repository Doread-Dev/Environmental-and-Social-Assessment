const Joi = require("joi");
const { text } = require("./text.validator");
const { tableVersion } = require("./version.validator");

// One record, upserted by its indicator (the project comes from the URL).
const recordSchema = Joi.object({
  indicator: Joi.string().hex().length(24).required(),
  scores: Joi.object({
    baseline: text().allow("", null).optional(),
    Q1: text().allow("", null).optional(),
    Q2: text().allow("", null).optional(),
    Q3: text().allow("", null).optional(),
    Q4: text().allow("", null).optional(),
  }).optional(),
  total: text().allow("", null).optional(),
  final_assessment: text().allow("", null).optional(),
  // Empty (null) until the user picks a level; null clears it (D69).
  ranking: Joi.string()
    .valid("negligible", "low", "medium", "high", "not_applicable")
    .allow(null)
    .optional(),
  responsible: Joi.string().allow(null, "").optional(),
  responsible_text: text().allow("", null).optional(),
  note: text().allow("", null),
});

// PUT /projects/:id/monitoring: records upserted by indicator (one per indicator). `version` =
// the table's revision the client loaded (D62).
const upsertMonitoringSchema = Joi.object({
  version: tableVersion,
  records: Joi.array()
    .items(
      recordSchema.keys({
        project: Joi.any().strip(),
      })
    )
    .required(),
});

module.exports = { upsertMonitoringSchema };
