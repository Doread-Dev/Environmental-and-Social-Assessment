const mongoose = require("mongoose");

// One entry per status change of a screening or assessment (D16), appended on create and by
// the submit/approve/reject endpoints.
const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["created", "submitted", "approved", "rejected"],
      required: true,
    },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    at: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false, versionKey: false }
);

module.exports = statusHistorySchema;
