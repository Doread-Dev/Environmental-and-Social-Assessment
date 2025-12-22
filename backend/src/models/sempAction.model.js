const mongoose = require("mongoose");

const sempActionSchema = new mongoose.Schema(
  {
    target: { type: mongoose.Schema.Types.ObjectId, ref: "SempTarget", required: true },
    action_text: { type: String, required: true },
    responsible: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resources: { type: String },
    due_date: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("SempAction", sempActionSchema);

