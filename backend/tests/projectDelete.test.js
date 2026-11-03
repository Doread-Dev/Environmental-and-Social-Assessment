import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, mongoose, require } from "./helpers/app.js";
import { loginAs } from "./helpers/fixtures.js";

const Project = require("../../src/models/project.model");
const Screening = require("../../src/models/screening.model");
const Assessment = require("../../src/models/assessment.model");
const AssessmentMethod = require("../../src/models/assessmentMethod.model");
const CommunityConsultation = require("../../src/models/communityConsultation.model");
const AssessmentImpactScore = require("../../src/models/assessmentImpactScore.model");
const ManagementActivity = require("../../src/models/managementActivity.model");
const MitigationPlan = require("../../src/models/mitigationPlan.model");
const MonitoringRecord = require("../../src/models/monitoringRecord.model");

const projectChildren = [
  Screening,
  Assessment,
  ManagementActivity,
  MitigationPlan,
  MonitoringRecord,
];
const assessmentChildren = [AssessmentMethod, CommunityConsultation, AssessmentImpactScore];

// Inserts one row of every project-owned collection, bypassing schema validation:
// the test is about the cascade, not about each model's required fields.
async function createProjectWithData(title) {
  const project = await Project.create({
    title,
    location: "Aleppo",
    start_date: new Date("2026-01-01"),
    end_date: new Date("2026-12-31"),
  });
  for (const Model of projectChildren) {
    await Model.collection.insertOne({ project: project._id });
  }
  const assessment = await Assessment.collection.findOne({ project: project._id });
  for (const Model of assessmentChildren) {
    await Model.collection.insertOne({ assessment: assessment._id });
  }
  return { project, assessmentId: assessment._id };
}

async function countFor({ project, assessmentId }) {
  const counts = {};
  for (const Model of projectChildren) {
    counts[Model.modelName] = await Model.countDocuments({ project: project._id });
  }
  for (const Model of assessmentChildren) {
    counts[Model.modelName] = await Model.countDocuments({ assessment: assessmentId });
  }
  return counts;
}

describe("DELETE /api/v1/projects/:id", () => {
  it("deletes the project and all its screening, assessment, SEMP and monitoring data", async () => {
    const { token } = await loginAs("environmental_specialist");
    const doomed = await createProjectWithData("Doomed");
    const kept = await createProjectWithData("Kept");

    const res = await request(app)
      .delete(`/api/v1/projects/${doomed.project._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(await Project.exists({ _id: doomed.project._id })).toBeNull();
    expect(Object.values(await countFor(doomed)).every((n) => n === 0)).toBe(true);
    expect(Object.values(await countFor(kept)).every((n) => n === 1)).toBe(true);
    expect(await Project.exists({ _id: kept.project._id })).not.toBeNull();
  });

  it("returns 404 for an unknown project", async () => {
    const { token } = await loginAs("environmental_specialist");

    const res = await request(app)
      .delete(`/api/v1/projects/${new mongoose.Types.ObjectId()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
