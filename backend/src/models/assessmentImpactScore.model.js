const mongoose = require("mongoose");

const assessmentImpactScoreSchema = new mongoose.Schema(
  {
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment", required: true },
    question: { type: mongoose.Schema.Types.ObjectId, ref: "ImpactQuestion", required: true },
    level: {
      type: String,
      enum: ["negligible", "low", "medium", "high", "not_applicable"],
      required: true,
    },
    note: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("AssessmentImpactScore", assessmentImpactScoreSchema);

