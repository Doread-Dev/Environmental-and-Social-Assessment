const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    project_component: { type: String, trim: true },
    // Archived projects are hidden from default lists and read-only (D17).
    archived: { type: Boolean, default: false },
    archived_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    archived_at: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Project", projectSchema);
