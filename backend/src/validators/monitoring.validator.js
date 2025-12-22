const Joi = require("joi");

const createMonitoringSchema = Joi.object({
  project: Joi.string().required(),
  indicator: Joi.string().required(),
  scores: Joi.object({
    baseline: Joi.number().optional(),
    Q1: Joi.number().optional(),
    Q2: Joi.number().optional(),
    Q3: Joi.number().optional(),
    Q4: Joi.number().optional(),
  }).optional(),
  total: Joi.number().optional(),
  final_assessment: Joi.string().valid("negligible", "low", "medium", "high", "not_applicable").optional(),
  ranking: Joi.number().min(0).max(3).optional(),
  responsible: Joi.string().optional(),
  note: Joi.string().allow("", null),
});

const updateMonitoringSchema = createMonitoringSchema;

const updateQuarterSchema = Joi.object({
  value: Joi.number().required(),
});

module.exports = {
  createMonitoringSchema,
  updateMonitoringSchema,
  updateQuarterSchema,
};

