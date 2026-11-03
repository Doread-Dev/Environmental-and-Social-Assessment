// Cleanup script to purge test data. Dev-only: refuses to run in production.
require("dotenv").config();

if (process.env.NODE_ENV === "production") {
  console.error("clean-test-data.js refuses to run with NODE_ENV=production.");
  process.exit(1);
}

const mongoose = require("mongoose");

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
  ];
  for (const m of models) {
    const res = await m.deleteMany({});
    console.log(`${m.modelName}: deleted ${res.deletedCount}`);
  }
  await mongoose.connection.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
