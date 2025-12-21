const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        error: errorMessages,
      });
    }

    next();
  };
};

module.exports = validate;

