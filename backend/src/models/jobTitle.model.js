const mongoose = require("mongoose");

const jobTitleSchema = new mongoose.Schema(
  {
    title_name: { type: String, required: true, unique: true, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("JobTitle", jobTitleSchema);

