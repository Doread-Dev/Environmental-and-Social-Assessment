const mongoose = require("mongoose");

const assessmentMethodSchema = new mongoose.Schema(
  {
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment", required: true },
    method_type: { type: String, required: true },
    details: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("AssessmentMethod", assessmentMethodSchema);

