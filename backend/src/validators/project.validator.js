const Joi = require("joi");

const createProjectSchema = Joi.object({
  title: Joi.string().trim().required(),
  location: Joi.string().trim().required(),
  start_date: Joi.date().required(),
  end_date: Joi.date().required(),
  project_component: Joi.string().trim().optional(),
});

const updateProjectSchema = createProjectSchema.fork(
  ["title", "location", "start_date", "end_date"],
  (schema) => schema.optional()
);

module.exports = {
  createProjectSchema,
  updateProjectSchema,
};

