const Joi = require("joi");

const createAssessmentSchema = Joi.object({
  project: Joi.string().required(),
  // Inputs start empty and nothing is prefilled (D69); project_activity and description are
  // required when the assessment is submitted (D57), not here.
  project_activity: Joi.string().allow("", null),
  description: Joi.string().allow("", null),
  environmental_setting: Joi.string().allow("", null),
  legal_requirements: Joi.string().allow("", null),
  potential_negative_impact: Joi.string().allow("", null),
  potential_positive_impact: Joi.string().allow("", null),
  // status, officer, approved_by, reject_by, reject_reason, recommendations (the approver's
  // field, set only by approve — D63 a) and the calculated totals are server-owned: stripped
  // from create/update bodies.
});

// A draft may be saved with any field empty; submit checks the required ones (D57, D69).
const updateAssessmentSchema = createAssessmentSchema.fork(["project"], (schema) =>
  schema.optional()
);

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
  replaceMethodsSchema,
  replaceConsultationsSchema,
  addScoresSchema,
  approveAssessmentSchema,
  rejectAssessmentSchema,
};
