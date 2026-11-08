const Joi = require("joi");
const { LANGUAGES } = require("../services/help.service");

// GET /help: the language of the user guide (phase 14, D78).
const helpQuerySchema = Joi.object({
  lang: Joi.string()
    .valid(...LANGUAGES)
    .default("en"),
});

module.exports = { helpQuerySchema };
