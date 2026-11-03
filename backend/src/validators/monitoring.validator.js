const Joi = require("joi");

const createMonitoringSchema = Joi.object({
  project: Joi.string().required(),
  indicator: Joi.string().required(),
  scores: Joi.object({
    baseline: Joi.string().allow("", null).optional(),
    Q1: Joi.string().allow("", null).optional(),
    Q2: Joi.string().allow("", null).optional(),
    Q3: Joi.string().allow("", null).optional(),
    Q4: Joi.string().allow("", null).optional(),
  }).optional(),
  total: Joi.string().allow("", null).optional(),
  final_assessment: Joi.string().allow("", null).optional(),
  ranking: Joi.string().valid("negligible", "low", "medium", "high", "not_applicable").optional(),
  responsible: Joi.string().allow(null, "").optional(),
  responsible_text: Joi.string().allow("", null).optional(),
  note: Joi.string().allow("", null),
});

const updateMonitoringSchema = createMonitoringSchema;

const updateQuarterSchema = Joi.object({
  value: Joi.string().allow("", null).required(),
});

// PUT /projects/:id/monitoring: records upserted by indicator (one per indicator).
const upsertMonitoringSchema = Joi.object({
  records: Joi.array()
    .items(
      createMonitoringSchema.keys({
        indicator: Joi.string().hex().length(24).required(),
        project: Joi.any().strip(),
      })
    )
    .required(),
});

module.exports = {
  createMonitoringSchema,
  upsertMonitoringSchema,
  updateMonitoringSchema,
  updateQuarterSchema,
};
