const Joi = require("joi");
const { text } = require("./text.validator");
const { recordVersion } = require("./version.validator");

const createProjectSchema = Joi.object({
  title: text().trim().required(),
  location: text().trim().required(),
  start_date: Joi.date().required(),
  end_date: Joi.date().required(),
  project_component: text().trim().optional(),
});

// The version the client loaded (the project's `updatedAt`) is required: stale → 409 (D62).
const updateProjectSchema = createProjectSchema
  .fork(["title", "location", "start_date", "end_date"], (schema) => schema.optional())
  .keys({ version: recordVersion });

// GET /projects. Without `limit` every matching project is returned (one page).
const listProjectsQuerySchema = Joi.object({
  archived: Joi.boolean().default(false),
  search: Joi.string().trim().allow("").optional(),
  status: Joi.string()
    .valid("draft", "in_progress", "needs_action", "monitoring", "completed")
    .optional(),
  category: Joi.string().valid("A", "B", "C", "D", "E", "F").optional(),
  sort: Joi.string().valid("createdAt", "updatedAt", "title", "start_date").default("createdAt"),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  listProjectsQuerySchema,
};
