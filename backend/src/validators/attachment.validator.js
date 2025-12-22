const Joi = require("joi");

const createAttachmentSchema = Joi.object({
  entity_type: Joi.string().valid("project", "screening", "assessment", "monitoring").required(),
  entity_id: Joi.string().required(),
  file_name: Joi.string().required(),
  file_path: Joi.string().required(),
  file_type: Joi.string().allow("", null),
  file_size: Joi.number().optional(),
  uploaded_by: Joi.string().optional(),
});

module.exports = {
  createAttachmentSchema,
};

