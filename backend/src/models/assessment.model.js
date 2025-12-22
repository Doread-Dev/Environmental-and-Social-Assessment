const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    officer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    project_activity: { type: String, required: true },
    description: { type: String, required: true },
    environmental_setting: { type: String },
    legal_requirements: { type: String },

    total_project_score: { type: Number },
    total_project_impact: { type: String, enum: ["low", "medium", "high"] },
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

