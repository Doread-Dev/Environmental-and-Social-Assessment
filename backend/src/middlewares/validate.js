// Validates req.body (or req.query with source "query") and replaces it with Joi's value: unknown
// fields (incl. server-owned ones such as status, officer, approved_by) are stripped, so
// controllers only see allowed fields, with defaults applied and types converted.
const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message).join(", ");
      return res.status(400).json({
        success: false,
        error: errorMessages,
      });
    }

    req[source] = value;
    next();
  };
};

module.exports = validate;
