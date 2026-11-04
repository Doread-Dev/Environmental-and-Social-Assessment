const Joi = require("joi");

// One record, upserted by its indicator (the project comes from the URL).
const recordSchema = Joi.object({
  indicator: Joi.string().hex().length(24).required(),
  scores: Joi.object({
    baseline: Joi.string().allow("", null).optional(),
    Q1: Joi.string().allow("", null).optional(),
    Q2: Joi.string().allow("", null).optional(),
    Q3: Joi.string().allow("", null).optional(),
    Q4: Joi.string().allow("", null).optional(),
  }).optional(),
  total: Joi.string().allow("", null).optional(),
  final_assessment: Joi.string().allow("", null).optional(),
  // Empty (null) until the user picks a level; null clears it (D69).
  ranking: Joi.string()
    .valid("negligible", "low", "medium", "high", "not_applicable")
    .allow(null)
    .optional(),
  responsible: Joi.string().allow(null, "").optional(),
  responsible_text: Joi.string().allow("", null).optional(),
  note: Joi.string().allow("", null),
});

// PUT /projects/:id/monitoring: records upserted by indicator (one per indicator).
const upsertMonitoringSchema = Joi.object({
  records: Joi.array()
    .items(
      recordSchema.keys({
        project: Joi.any().strip(),
      })
    )
    .required(),
});

module.exports = { upsertMonitoringSchema };
