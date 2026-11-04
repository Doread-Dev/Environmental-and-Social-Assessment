const Joi = require("joi");
const { FILE_AREAS, ANNEX_CATEGORIES, SEMP_RECORD_CATEGORIES } = require("../config/files");

const area = Joi.string().valid(...FILE_AREAS);

const listFilesQuerySchema = Joi.object({
  area: area.default("annex"),
});

// Multipart text fields (multer puts them in req.body). An annex file needs its annex; a SEMP
// record may be uncategorised.
const uploadFileSchema = Joi.object({
  area: area.required(),
  category: Joi.when("area", {
    is: "annex",
    then: Joi.string()
      .valid(...ANNEX_CATEGORIES)
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
