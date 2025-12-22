const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    entity_type: {
      type: String,
      enum: ["project", "screening", "assessment", "monitoring"],
      required: true,
    },
    entity_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    file_name: { type: String, required: true },
    file_path: { type: String, required: true },
    file_type: { type: String },
    file_size: { type: Number },
    uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Attachment", attachmentSchema);

