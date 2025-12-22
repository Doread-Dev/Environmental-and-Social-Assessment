const mongoose = require("mongoose");

const indicatorSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: "ImpactCategory", required: true },
    name: { type: String, required: true },
    definition: { type: String, required: true },
    measurement: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Indicator", indicatorSchema);

