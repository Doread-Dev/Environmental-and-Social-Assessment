const mongoose = require("mongoose");

const scoreCountSchema = new mongoose.Schema(
  {
    negligible: { type: Number, default: 0 },
    low: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    high: { type: Number, default: 0 },
    not_applicable: { type: Number, default: 0 },
  },
  { _id: false, versionKey: false }
);

const assessmentSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project_activity: { type: String, required: true },
    description: { type: String, required: true },
    environmental_setting: { type: String },
    legal_requirements: { type: String },

    total_project_score: scoreCountSchema,
    total_project_impact: {
      type: String,
      enum: ["negligible", "low", "medium", "high", "not_applicable"],
    },
    is_complete: { type: Boolean, default: false },

    potential_negative_impact: { type: String },
    potential_positive_impact: { type: String },

    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    recommendations: { type: String },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected"],
      default: "draft",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Assessment", assessmentSchema);
