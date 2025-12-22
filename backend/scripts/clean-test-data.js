// Cleanup script to purge test data and uploads.
require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const connectDB = require("../src/config/database");
const Project = require("../src/models/project.model");
const Screening = require("../src/models/screening.model");
const Assessment = require("../src/models/assessment.model");
const AssessmentMethod = require("../src/models/assessmentMethod.model");
const CommunityConsultation = require("../src/models/communityConsultation.model");
const AssessmentImpactScore = require("../src/models/assessmentImpactScore.model");
const Monitoring = require("../src/models/monitoringRecord.model");
const Management = require("../src/models/managementActivity.model");
const Mitigation = require("../src/models/mitigationPlan.model");
const SempObjective = require("../src/models/sempObjective.model");
const SempTarget = require("../src/models/sempTarget.model");
const SempAction = require("../src/models/sempAction.model");
const Attachment = require("../src/models/attachment.model");

async function removeUploads() {
  const uploadsDir = path.join(process.cwd(), "backend", "uploads");
  if (!fs.existsSync(uploadsDir)) return;
  const files = fs.readdirSync(uploadsDir);
  for (const f of files) {
    fs.unlinkSync(path.join(uploadsDir, f));
  }
  console.log(`Removed ${files.length} uploaded file(s).`);
}

async function main() {
  await connectDB();
  const models = [
    Project,
    Screening,
    Assessment,
    AssessmentMethod,
    CommunityConsultation,
    AssessmentImpactScore,
    Monitoring,
    Management,
    Mitigation,
    SempObjective,
    SempTarget,
    SempAction,
    Attachment,
  ];
  for (const m of models) {
    const res = await m.deleteMany({});
    console.log(`${m.modelName}: deleted ${res.deletedCount}`);
  }
  await removeUploads();
  await mongoose.connection.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
