const mongoose = require("mongoose");

const screeningSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    category_code: { type: String, enum: ["A", "B", "C", "D", "E", "F"], required: true },
    category_reason: { type: String, required: true },
    potential_negative: { type: String },
    potential_positive: { type: String },
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    recommendations: { type: String },
    screening_date: { type: Date, default: Date.now },
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

module.exports = mongoose.model("Screening", screeningSchema);

