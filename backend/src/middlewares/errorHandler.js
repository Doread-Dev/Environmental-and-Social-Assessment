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
  const development = process.env.NODE_ENV === "development";
  // A server error never shows its message to the client when it comes from a failed
  // authentication, or when it is unexpected (not an ApiError we wrote on purpose) outside
  // development: it may name paths, queries or library internals. The full error is logged above.
  const hideMessage =
    statusCode >= 500 && (Boolean(authError) || (!(err instanceof ApiError) && !development));
  const message = hideMessage ? "Server Error" : error.message || "Server Error";

  res.status(statusCode).json({
    success: false,
    error: message,
    // A machine-readable reason when the client must react, e.g. PASSWORD_CHANGE_REQUIRED.
    ...(err instanceof ApiError && typeof err.code === "string" && { code: err.code }),
    ...(!authError && development && { stack: err.stack }),
  });
};

module.exports = errorHandler;
