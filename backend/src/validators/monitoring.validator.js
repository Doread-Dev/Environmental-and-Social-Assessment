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
  ranking: Joi.string()
    .valid("negligible", "low", "medium", "high", "not_applicable")
    .optional(),
  responsible: Joi.string().optional(),
  note: Joi.string().allow("", null),
});

const updateMonitoringSchema = createMonitoringSchema;

const updateQuarterSchema = Joi.object({
  value: Joi.string().allow("", null).required(),
});

module.exports = {
  createMonitoringSchema,
  updateMonitoringSchema,
  updateQuarterSchema,
};
