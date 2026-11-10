const Joi = require("joi");

// The version the client loaded (D62, D73), required on every write of project data.
// Project, screening, assessment: the record's `updatedAt` as an ISO date.
const recordVersion = Joi.date().iso().required().messages({
  "any.required": "version is required (reload the page and try again)",
});

// Tools 3, 4 and Monitoring: the table's revision, as returned with the table.
const tableVersion = Joi.number().integer().min(0).required().messages({
  "any.required": "version is required (reload the page and try again)",
});

// Body of a submit: only the version.
const submitSchema = Joi.object({ version: recordVersion });

module.exports = { recordVersion, tableVersion, submitSchema };
