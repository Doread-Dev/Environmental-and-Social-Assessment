// Message of a Mongoose ValidationError (all field messages) or of any other error.
const validationMessage = (err) =>
  err.errors
    ? Object.values(err.errors)
        .map((e) => e.message)
        .join(", ")
    : err.message;

module.exports = validationMessage;
