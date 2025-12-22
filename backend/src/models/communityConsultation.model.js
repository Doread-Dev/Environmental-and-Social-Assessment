const mongoose = require("mongoose");

const communityConsultationSchema = new mongoose.Schema(
  {
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment", required: true },
    type: { type: String, required: true },
    participants: { type: String },
    notes: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("CommunityConsultation", communityConsultationSchema);

