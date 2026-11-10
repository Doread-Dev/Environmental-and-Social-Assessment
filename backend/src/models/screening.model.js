const mongoose = require("mongoose");
const statusHistorySchema = require("./statusHistory.schema");

const screeningSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    category_code: { type: String, enum: ["A", "B", "C", "D", "E", "F"], required: true },
    category_reason: { type: String, required: true },
    potential_negative: { type: String },
    potential_positive: { type: String },
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    recommendations: { type: String },
    reject_reason: { type: String },
    reject_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    officer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    screening_date: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected"],
      default: "draft",
    },
    status_history: [statusHistorySchema],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// One screening per project (D18).
screeningSchema.index({ project: 1 }, { unique: true });

module.exports = mongoose.model("Screening", screeningSchema);
