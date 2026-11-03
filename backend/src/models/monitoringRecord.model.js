const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema(
  {
    baseline: { type: String },
    Q1: { type: String },
    Q2: { type: String },
    Q3: { type: String },
    Q4: { type: String },
  },
  { _id: false, versionKey: false }
);

const monitoringRecordSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    indicator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Indicator",
      required: true,
    },
    scores: scoreSchema,
    total: { type: String },
    final_assessment: { type: String },
    ranking: {
      type: String,
      enum: ["negligible", "low", "medium", "high", "not_applicable"],
    },
    responsible: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    responsible_text: { type: String }, // external party, when no internal user (D55)
    note: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// One record per indicator in a project (D58).
monitoringRecordSchema.index({ project: 1, indicator: 1 }, { unique: true });

module.exports = mongoose.model("MonitoringRecord", monitoringRecordSchema);
