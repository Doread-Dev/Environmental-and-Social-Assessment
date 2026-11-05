const mongoose = require("mongoose");

// The revision of a project's table-style tool (Tools 3, 4 and Monitoring, D62): raised by every
// successful bulk save, sent back by the client with its next save. A save that carries an older
// revision is refused (409), so a second tab or user never overwrites rows it has not seen.
const TABLES = ["management", "mitigation", "monitoring"];

const tableRevisionSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    table: { type: String, enum: TABLES, required: true },
    revision: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

tableRevisionSchema.index({ project: 1, table: 1 }, { unique: true });

module.exports = mongoose.model("TableRevision", tableRevisionSchema);
module.exports.TABLES = TABLES;
