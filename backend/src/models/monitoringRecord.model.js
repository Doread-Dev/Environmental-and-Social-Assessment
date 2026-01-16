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
    note: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("MonitoringRecord", monitoringRecordSchema);
