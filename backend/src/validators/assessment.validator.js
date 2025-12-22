const Joi = require("joi");

const createAssessmentSchema = Joi.object({
  project: Joi.string().required(),
  officer: Joi.string().required(),
  project_activity: Joi.string().required(),
  description: Joi.string().required(),
  environmental_setting: Joi.string().allow("", null),
  legal_requirements: Joi.string().allow("", null),
  potential_negative_impact: Joi.string().allow("", null),
  potential_positive_impact: Joi.string().allow("", null),
  approved_by: Joi.string().optional(),
  recommendations: Joi.string().allow("", null),
  status: Joi.string().valid("draft", "submitted", "approved", "rejected").optional(),
});

const updateAssessmentSchema = createAssessmentSchema.fork(
  ["project", "officer", "project_activity", "description"],
  (schema) => schema.optional()
);

const addMethodSchema = Joi.object({
  method_type: Joi.string().required(),
  details: Joi.string().allow("", null),
});

const addConsultationSchema = Joi.object({
  type: Joi.string().required(),
  participants: Joi.string().allow("", null),
  notes: Joi.string().allow("", null),
});

const addScoresSchema = Joi.array()
  .items(
    Joi.object({
      question: Joi.string().required(),
      level: Joi.string()
        .valid("negligible", "low", "medium", "high", "not_applicable")
        .required(),
      note: Joi.string().allow("", null),
    })
  )
  .min(1);

module.exports = {
  createAssessmentSchema,
  updateAssessmentSchema,
  addMethodSchema,
  addConsultationSchema,
  addScoresSchema,
};

