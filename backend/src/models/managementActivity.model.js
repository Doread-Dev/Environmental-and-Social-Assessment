const mongoose = require("mongoose");

const managementActivitySchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    serial_number: { type: Number },
    activity_description: { type: String, required: true },
    potential_impact: { type: String }, // free text
    recommended_actions: { type: mongoose.Schema.Types.Mixed }, // string or array
    monitoring_requirements: { type: String },
    responsible: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("ManagementActivity", managementActivitySchema);

