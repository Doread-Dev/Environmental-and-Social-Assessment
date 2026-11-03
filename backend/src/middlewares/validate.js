// Validates req.body and replaces it with Joi's value: unknown fields (incl. server-owned ones
// such as status, officer, approved_by) are stripped, so controllers only see allowed fields.
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
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

    req.body = value;
    next();
  };
};

module.exports = validate;
