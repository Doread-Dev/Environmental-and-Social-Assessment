const mongoose = require("mongoose");

const impactCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true }, // A, B, C...
    name_ar: { type: String, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("ImpactCategory", impactCategorySchema);

