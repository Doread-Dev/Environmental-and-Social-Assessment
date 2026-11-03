const Joi = require("joi");

const createAssessmentSchema = Joi.object({
  project: Joi.string().required(),
  // Left empty, project_activity is prefilled from the project component on create (D53).
  project_activity: Joi.string().allow("", null),
  description: Joi.string().required(),
  environmental_setting: Joi.string().allow("", null),
  legal_requirements: Joi.string().allow("", null),
  potential_negative_impact: Joi.string().allow("", null),
  potential_positive_impact: Joi.string().allow("", null),
  recommendations: Joi.string().allow("", null),
  // status, officer, approved_by, reject_by, reject_reason and the calculated totals are
  // server-owned: stripped from create/update bodies.
});

const updateAssessmentSchema = createAssessmentSchema
  .fork(["project", "description"], (schema) => schema.optional())
  .keys({
    // Required (D57): an update may omit it, but not empty it.
    project_activity: Joi.string(),
  });

const addMethodSchema = Joi.object({
  method_type: Joi.string().required(),
  details: Joi.string().allow("", null),
});

const replaceMethodsSchema = Joi.array().items(addMethodSchema).min(0);

const addConsultationSchema = Joi.object({
  type: Joi.string().required(),
  participants: Joi.string().allow("", null),
  notes: Joi.string().allow("", null),
});

const replaceConsultationsSchema = Joi.array().items(addConsultationSchema).min(0);

const addScoresSchema = Joi.array()
  .items(
    Joi.object({
      question: Joi.string().hex().length(24).required(),
      level: Joi.string().valid("negligible", "low", "medium", "high", "not_applicable").required(),
      note: Joi.string().allow("", null),
    })
  )
  .min(1);

const approveAssessmentSchema = Joi.object({
  recommendations: Joi.string().allow("", null).optional(),
});

const rejectAssessmentSchema = Joi.object({
  reject_reason: Joi.string().allow("", null).optional(),
});

module.exports = {
  createAssessmentSchema,
  updateAssessmentSchema,
  addMethodSchema,
  replaceMethodsSchema,
  addConsultationSchema,
  replaceConsultationsSchema,
  addScoresSchema,
  approveAssessmentSchema,
  rejectAssessmentSchema,
};
