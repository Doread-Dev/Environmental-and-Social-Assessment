const mongoose = require("mongoose");

const impactQuestionSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: "ImpactCategory", required: true },
    question_text: { type: String, required: true },
    question_text_ar: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("ImpactQuestion", impactQuestionSchema);

