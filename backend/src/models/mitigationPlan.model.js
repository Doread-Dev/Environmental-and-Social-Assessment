const mongoose = require("mongoose");

const mitigationPlanSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    serial_number: { type: Number },
    output_description: { type: String, required: true },
    potential_impact_and_significance: { type: String },
    mitigation_and_enhancement_measures: { type: String },
    monitoring: { type: String },
    schedule: { type: String },
    responsible: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("MitigationPlan", mitigationPlanSchema);
