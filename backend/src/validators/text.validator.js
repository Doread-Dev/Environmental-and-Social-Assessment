const Joi = require("joi");

// Free text is limited to 30,000 characters (D74 4): an Excel cell holds at most 32,767, so every
// export stays complete. This is a maximum against runaway input, not a minimum (D57 stays).
const MAX_TEXT_LENGTH = 30000;

const text = () =>
  Joi.string()
    .max(MAX_TEXT_LENGTH)
    .messages({ "string.max": "{#label} is too long (at most 30,000 characters)" });

// The approver's recommendations: required to approve a screening or an assessment (D74 5,
// replaces the "optional" of D56).
const RECOMMENDATIONS_REQUIRED = "Recommendations are required to approve";
const recommendations = () =>
  text().trim().required().messages({
    "any.required": RECOMMENDATIONS_REQUIRED,
    "string.empty": RECOMMENDATIONS_REQUIRED,
  });

module.exports = { MAX_TEXT_LENGTH, RECOMMENDATIONS_REQUIRED, text, recommendations };
