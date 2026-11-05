const Joi = require("joi");
const { recommendations, text } = require("./text.validator");
const { recordVersion } = require("./version.validator");

const createAssessmentSchema = Joi.object({
  project: Joi.string().required(),
  // Inputs start empty and nothing is prefilled (D69); project_activity and description are
  // required when the assessment is submitted (D57), not here.
  project_activity: text().allow("", null),
  description: text().allow("", null),
  environmental_setting: text().allow("", null),
  legal_requirements: text().allow("", null),
  potential_negative_impact: text().allow("", null),
  potential_positive_impact: text().allow("", null),
  // status, officer, approved_by, reject_by, reject_reason, recommendations (the approver's
  // field, set only by approve — D63 a) and the calculated totals are server-owned: stripped
  // from create/update bodies.
});

// A draft may be saved with any field empty; submit checks the required ones (D57, D69).
// Every content write carries the version the client loaded (the assessment's `updatedAt`, D62).
const updateAssessmentSchema = createAssessmentSchema
  .fork(["project"], (schema) => schema.optional())
  .keys({ version: recordVersion });

const addMethodSchema = Joi.object({
  method_type: text().required(),
  details: text().allow("", null),
});

const replaceMethodsSchema = Joi.object({
  version: recordVersion,
  methods: Joi.array().items(addMethodSchema).required(),
});

const addConsultationSchema = Joi.object({
  type: text().required(),
  participants: text().allow("", null),
  notes: text().allow("", null),
});

const replaceConsultationsSchema = Joi.object({
  version: recordVersion,
  consultations: Joi.array().items(addConsultationSchema).required(),
});

const addScoresSchema = Joi.object({
  version: recordVersion,
  scores: Joi.array()
    .items(
      Joi.object({
        question: Joi.string().hex().length(24).required(),
        level: Joi.string()
          .valid("negligible", "low", "medium", "high", "not_applicable")
          .required(),
        note: text().allow("", null),
      })
    )
    .min(1)
    .required(),
});

const approveAssessmentSchema = Joi.object({
  recommendations: recommendations(),
});

const rejectAssessmentSchema = Joi.object({
  reject_reason: text().allow("", null).optional(),
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
