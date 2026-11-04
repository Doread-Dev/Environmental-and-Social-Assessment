const multer = require("multer");
const ApiError = require("../utils/ApiError");
const { maxUploadBytes, maxUploadLabel } = require("../config/files");

// One file per request, kept in memory (≤ the size limit) so nothing touches the disk until it
// has been validated; the file service writes it under a server-generated name.
// `fieldSize`: the longest text field allowed (bytes), e.g. a library document description.
const singleFile =
  (fieldName, { fieldSize = 1024 } = {}) =>
  (req, res, next) => {
    const max = maxUploadBytes();
    const parse = multer({
      storage: multer.memoryStorage(),
      // Browsers send the file name as raw UTF-8 bytes (Arabic names); busboy's default is latin1.
      defParamCharset: "utf8",
      limits: { fileSize: max, files: 1, fields: 10, fieldSize },
    }).single(fieldName);

    parse(req, res, (err) => {
      if (!err) return next();
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new ApiError(413, `File is too large (max ${maxUploadLabel()})`));
      }
      if (err instanceof multer.MulterError) {
        const reason =
          err.code === "LIMIT_UNEXPECTED_FILE" || err.code === "LIMIT_FILE_COUNT"
            ? `Send exactly one file in the "${fieldName}" field`
            : err.message;
        return next(new ApiError(400, reason));
      }
      // Malformed multipart body
      return next(new ApiError(400, "Invalid upload"));
    });
  };

module.exports = { singleFile };
