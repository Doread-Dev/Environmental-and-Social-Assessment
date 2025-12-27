const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema(
  {
    baseline: { type: Number },
    Q1: { type: Number },
    Q2: { type: Number },
    Q3: { type: Number },
    Q4: { type: Number },
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
    total: { type: Number },
    final_assessment: {
      type: String,
      enum: ["negligible", "low", "medium", "high", "not_applicable"],
    },
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
