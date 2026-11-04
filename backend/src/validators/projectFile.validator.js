const Joi = require("joi");
const { FILE_AREAS, DOCUMENT_CATEGORIES, SEMP_RECORD_CATEGORIES } = require("../config/files");

const area = Joi.string().valid(...FILE_AREAS);

const listFilesQuerySchema = Joi.object({
  area: area.default("documents"),
});

// Multipart text fields (multer puts them in req.body). A project document needs its place (a
// project-workflow place key or "other", D64 d); a SEMP record may be uncategorised.
const uploadFileSchema = Joi.object({
  area: area.required(),
  category: Joi.when("area", {
    is: "documents",
    then: Joi.string()
      .valid(...DOCUMENT_CATEGORIES)
      .required(),
    otherwise: Joi.string()
      .valid(...SEMP_RECORD_CATEGORIES)
      .allow(null, "")
      .empty("")
      .default(null),
  }),
});

const updateFileSchema = Joi.object({
  category: Joi.string()
    .valid(...SEMP_RECORD_CATEGORIES)
    .allow(null)
    .required(),
});

module.exports = { listFilesQuerySchema, uploadFileSchema, updateFileSchema };
