const mongoose = require("mongoose");

const mitigationPlanSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    serial_number: { type: Number },
    output_description: { type: String, required: true },
    environmental_impact: { type: String },
    social_impact: { type: String },
    climate_impact: { type: String },
    impact_level: { type: String, enum: ["low", "medium", "high"] },
    mitigation_measures: { type: String },
    enhancement_measures: { type: String },
    monitoring: { type: String },
    schedule_before: { type: String },
    schedule_during: { type: String },
    schedule_after: { type: String },
    is_continuous: { type: Boolean, default: false },
    responsible: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("MitigationPlan", mitigationPlanSchema);

