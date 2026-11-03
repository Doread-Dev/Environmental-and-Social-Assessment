const ApiError = require("../utils/ApiError");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = new ApiError(404, message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    error = new ApiError(409, message);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = new ApiError(400, message);
  }

  // Joi validation error
  if (err.isJoi) {
    const message = err.details.map((detail) => detail.message).join(", ");
    error = new ApiError(400, message);
  }

  const statusCode = error.statusCode || 500;
  // Auth failures never leak internals: no stack, and a generic message for server errors.
  const authError = res.locals.authenticationError;
  let message = error.message || "Server Error";
  if (authError && statusCode >= 500) message = "Server Error";

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(!authError && process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
