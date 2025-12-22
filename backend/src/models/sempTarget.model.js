const mongoose = require("mongoose");

const sempTargetSchema = new mongoose.Schema(
  {
    objective: { type: mongoose.Schema.Types.ObjectId, ref: "SempObjective", required: true },
    target_text: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("SempTarget", sempTargetSchema);

