const mongoose = require("mongoose");
const { PLACE_KEYS } = require("../config/places");
const { LIBRARY_EXTENSIONS } = require("../config/files");

// A reference library document (D64 b): organisation guidance, the same for every project, not
// tied to one. One PDF, linked to zero or more places (config/places.js); none = general, shown
// on the Library page only. The file lives at <UPLOADS_DIR>/library/<stored_name>.
const libraryDocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    places: {
      type: [{ type: String, enum: PLACE_KEYS }],
      default: [],
    },
    // Lower first; documents with the same order are sorted by title.
    order: { type: Number, default: 0, min: 0 },
    // Shown and used as the download name only; never part of a path on disk.
    original_name: { type: String, required: true, trim: true },
    stored_name: {
      type: String,
      required: true,
      match: new RegExp(`^[0-9a-f-]{36}\\.(${LIBRARY_EXTENSIONS.join("|")})$`),
    },
    mime_type: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    // Who created the document, and who last changed it (details, links or file).
    uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, versionKey: false }
);

libraryDocumentSchema.index({ places: 1 });
libraryDocumentSchema.index({ order: 1, title: 1 });
libraryDocumentSchema.index({ stored_name: 1 }, { unique: true });

module.exports = mongoose.model("LibraryDocument", libraryDocumentSchema);
