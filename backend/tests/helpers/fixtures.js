import request from "supertest";
import { app, mongoose, require } from "./app.js";

const User = require("../../src/models/user.model");
const Project = require("../../src/models/project.model");
const Screening = require("../../src/models/screening.model");
const Assessment = require("../../src/models/assessment.model");
const ManagementActivity = require("../../src/models/managementActivity.model");
const MitigationPlan = require("../../src/models/mitigationPlan.model");
const { seedLookupData } = require("../../src/db/seed");

const { ROLES, EDITOR_ROLES, SPECIALIST_ROLES } = require("../../src/config/roles");

const TEST_PASSWORD = "test-password-123";

let userCounter = 0;

async function createUser(role = "environmental_specialist", overrides = {}) {
  userCounter += 1;
  const password = overrides.password || TEST_PASSWORD;
  const user = await User.create({
    name: `Test ${role} ${userCounter}`,
    email: `${role}.${userCounter}@example.com`,
    role,
    ...overrides,
    password,
  });
  return { user, password };
}

// Creates a user with the given role and logs in through the real API.
async function loginAs(role = "environmental_specialist", overrides = {}) {
  const { user, password } = await createUser(role, overrides);
  const res = await request(app).post("/api/v1/auth/login").send({ email: user.email, password });
  if (res.status !== 200) throw new Error(`Login as ${role} failed: ${res.status}`);
  return { user, token: res.body.data.token };
}

// Workflow stages a test project can start at, in order (D2). Records are written straight to
// the database: tests of a later tool don't depend on the API of the earlier ones.
const STAGES = ["new", "screening_approved", "assessment_approved", "semp_complete"];

async function createProject({ stage = "new", ...fields } = {}) {
  const level = STAGES.indexOf(stage);
  if (level < 0) throw new Error(`Unknown stage ${stage}`);
  const project = await Project.create({
    title: "Test project",
    location: "Aleppo",
    start_date: new Date("2026-01-01"),
    end_date: new Date("2026-12-31"),
    ...fields,
  });
  if (level >= 1) {
    await Screening.create({
      project: project._id,
      category_code: "B",
      category_reason: "Urban works",
      status: "approved",
    });
  }
  if (level >= 2) {
    await Assessment.create({
      project: project._id,
      project_activity: "Pipes",
      description: "Replace pipes",
      status: "approved",
    });
  }
  if (level >= 3) {
    await ManagementActivity.create({ project: project._id, activity_description: "Dig" });
    await MitigationPlan.create({ project: project._id, output_description: "Network" });
  }
  return project;
}

async function seedLookups() {
  await seedLookupData();
}

const TableRevision = require("../../src/models/tableRevision.model");

const recordVersionOf = async (Model, id) => {
  const doc = await Model.findById(id).select("updatedAt").lean();
  return doc?.updatedAt?.toISOString();
};

// The version a client that has just loaded the record or table would send (D62): the record's
// `updatedAt` for /projects/:id, /screenings/:id[/submit], /assessments/:id[/methods|
// consultations|scores|submit], the table's revision for /projects/:id/management|mitigation|
// monitoring. Undefined for an unknown record (the request then answers 400 or 404).
async function currentVersion(url) {
  const path = url.replace(/^\/api\/v1/, "").split("?")[0];
  const [, kind, id, sub] = path.split("/");
  if (!mongoose.isValidObjectId(id)) return undefined;
  if (kind === "projects" && ["management", "mitigation", "monitoring"].includes(sub)) {
    const row = await TableRevision.findOne({ project: id, table: sub }).lean();
    return row?.revision ?? 0;
  }
  if (kind === "projects") return recordVersionOf(Project, id);
  if (kind === "screenings") return recordVersionOf(Screening, id);
  if (kind === "assessments") return recordVersionOf(Assessment, id);
  return undefined;
}

// `body` with the current version added (unless it has one).
async function withVersion(url, body = {}) {
  if (Array.isArray(body) || "version" in body) return body;
  return { ...body, version: await currentVersion(url) };
}

export {
  ROLES,
  EDITOR_ROLES,
  SPECIALIST_ROLES,
  STAGES,
  TEST_PASSWORD,
  createUser,
  createProject,
  loginAs,
  seedLookups,
  currentVersion,
  withVersion,
};
