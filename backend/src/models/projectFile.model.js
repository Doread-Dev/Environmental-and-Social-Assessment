const mongoose = require("mongoose");
const {
  FILE_AREAS,
  DOCUMENT_CATEGORIES,
  SEMP_RECORD_CATEGORIES,
  ALLOWED_EXTENSIONS,
} = require("../config/files");

// A file uploaded to a project (D47): project documents (D64 d) now, SEMP Plan §7 records in v3.
const projectFileSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    area: { type: String, enum: FILE_AREAS, required: true },
    // documents: a project-workflow place key or "other" (required); semp_record: one of the 11
    // record types, or null.
    category: {
      type: String,
      default: null,
      validate: {
        validator: function (value) {
          if (this.area === "documents") return DOCUMENT_CATEGORIES.includes(value);
          return value === null || SEMP_RECORD_CATEGORIES.includes(value);
        },
        message: "Invalid category for this area",
      },
    },
    // Shown and used as the download name only; never part of a path on disk.
    original_name: { type: String, required: true, trim: true },
    // Server-generated (uuid + allowed extension), unique within the project folder.
    stored_name: {
      type: String,
      required: true,
      match: new RegExp(`^[0-9a-f-]{36}\\.(${ALLOWED_EXTENSIONS.join("|")})$`),
    },
    mime_type: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, versionKey: false }
);

projectFileSchema.index({ project: 1, area: 1, createdAt: 1 });
projectFileSchema.index({ stored_name: 1 }, { unique: true });

module.exports = mongoose.model("ProjectFile", projectFileSchema);
