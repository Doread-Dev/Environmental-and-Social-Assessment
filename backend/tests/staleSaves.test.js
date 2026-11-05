import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, require } from "./helpers/app.js";
import { createProject, currentVersion, loginAs, seedLookups } from "./helpers/fixtures.js";

const Project = require("../../src/models/project.model");
const Screening = require("../../src/models/screening.model");
const Assessment = require("../../src/models/assessment.model");
const AssessmentMethod = require("../../src/models/assessmentMethod.model");
const CommunityConsultation = require("../../src/models/communityConsultation.model");
const AssessmentImpactScore = require("../../src/models/assessmentImpactScore.model");
const ImpactQuestion = require("../../src/models/impactQuestion.model");
const ManagementActivity = require("../../src/models/managementActivity.model");
const MitigationPlan = require("../../src/models/mitigationPlan.model");
const MonitoringRecord = require("../../src/models/monitoringRecord.model");
const Indicator = require("../../src/models/indicator.model");
const TableRevision = require("../../src/models/tableRevision.model");

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const STALE = {
  success: false,
  error: "Someone else changed this since you opened it. Reload to see the latest version.",
  code: "STALE_VERSION",
};

// Everything a write could have changed, to prove a refused save wrote nothing.
const snapshot = async () =>
  JSON.stringify(
    await Promise.all(
      [
        Project,
        Screening,
        Assessment,
        AssessmentMethod,
        CommunityConsultation,
        AssessmentImpactScore,
        ManagementActivity,
        MitigationPlan,
        MonitoringRecord,
        TableRevision,
      ].map((Model) => Model.find().sort({ _id: 1 }).lean())
    )
  );

async function draftScreening(token) {
  const project = await createProject();
  const res = await request(app)
    .post("/api/v1/screenings")
    .set(auth(token))
    .send({ project: String(project._id), category_code: "B", category_reason: "Works" });
  return res.body.data._id;
}

async function draftAssessment(token) {
  await seedLookups();
  const project = await createProject({ stage: "screening_approved" });
  const res = await request(app)
    .post("/api/v1/assessments")
    .set(auth(token))
    .send({ project: String(project._id), project_activity: "Pipes", description: "Replace" });
  return res.body.data._id;
}

const firstQuestion = async () => String((await ImpactQuestion.findOne())._id);
const someIndicators = async () =>
  (await Indicator.find().sort({ _id: 1 }).limit(2)).map((i) => String(i._id));

// Each write of project data (D62): how to set it up, its URL and two different bodies (the two
// clients' edits), and a check that the second client's edit is what got saved after a reload.
const writes = [
  {
    name: "project PUT",
    method: "put",
    setup: async () => String((await createProject())._id),
    url: (id) => `/api/v1/projects/${id}`,
    bodies: [{ title: "First tab" }, { title: "Second tab" }],
    saved: async (id) => (await Project.findById(id)).title,
    expected: "Second tab",
  },
  {
    name: "screening PUT",
    method: "put",
    setup: draftScreening,
    url: (id) => `/api/v1/screenings/${id}`,
    bodies: [{ category_reason: "First tab" }, { category_reason: "Second tab" }],
    saved: async (id) => (await Screening.findById(id)).category_reason,
    expected: "Second tab",
  },
  {
    name: "assessment PUT",
    method: "put",
    setup: draftAssessment,
    url: (id) => `/api/v1/assessments/${id}`,
    bodies: [{ description: "First tab" }, { description: "Second tab" }],
    saved: async (id) => (await Assessment.findById(id)).description,
    expected: "Second tab",
  },
  {
    name: "assessment methods",
    method: "put",
    setup: draftAssessment,
    url: (id) => `/api/v1/assessments/${id}/methods`,
    bodies: [
      { methods: [{ method_type: "field_visits", details: "First tab" }] },
      { methods: [{ method_type: "field_visits", details: "Second tab" }] },
    ],
    saved: async (id) =>
      (await AssessmentMethod.find({ assessment: id }).lean()).map((m) => m.details),
    expected: ["Second tab"],
  },
  {
    name: "assessment consultations",
    method: "put",
    setup: draftAssessment,
    url: (id) => `/api/v1/assessments/${id}/consultations`,
    bodies: [
      { consultations: [{ type: "village_meetings", notes: "First tab" }] },
      { consultations: [{ type: "village_meetings", notes: "Second tab" }] },
    ],
    saved: async (id) =>
      (await CommunityConsultation.find({ assessment: id }).lean()).map((c) => c.notes),
    expected: ["Second tab"],
  },
  {
    name: "assessment scores",
    method: "post",
    setup: draftAssessment,
    url: (id) => `/api/v1/assessments/${id}/scores`,
    bodies: async () => {
      const question = await firstQuestion();
      return [{ scores: [{ question, level: "low" }] }, { scores: [{ question, level: "high" }] }];
    },
    saved: async (id) =>
      (await AssessmentImpactScore.findOne({ assessment: id, question: await firstQuestion() }))
        .level,
    expected: "high",
  },
  {
    name: "Tool 3 bulk save",
    method: "put",
    setup: async () => String((await createProject({ stage: "assessment_approved" }))._id),
    url: (id) => `/api/v1/projects/${id}/management`,
    bodies: [
      { rows: [{ activity_description: "First tab" }] },
      { rows: [{ activity_description: "Second tab" }] },
    ],
    saved: async (id) =>
      (await ManagementActivity.find({ project: id }).lean()).map((r) => r.activity_description),
    expected: ["Second tab"],
  },
  {
    name: "Tool 4 bulk save",
    method: "put",
    setup: async () => String((await createProject({ stage: "assessment_approved" }))._id),
    url: (id) => `/api/v1/projects/${id}/mitigation`,
    bodies: [
      { rows: [{ output_description: "First tab" }] },
      { rows: [{ output_description: "Second tab" }] },
    ],
    saved: async (id) =>
      (await MitigationPlan.find({ project: id }).lean()).map((r) => r.output_description),
    expected: ["Second tab"],
  },
  {
    name: "Tool 5 bulk save",
    method: "put",
    setup: async () => {
      await seedLookups();
      return String((await createProject({ stage: "semp_complete" }))._id);
    },
    url: (id) => `/api/v1/projects/${id}/monitoring`,
    bodies: async () => {
      const [indicator] = await someIndicators();
      return [
        { records: [{ indicator, note: "First tab" }] },
        { records: [{ indicator, note: "Second tab" }] },
      ];
    },
    saved: async (id) => (await MonitoringRecord.find({ project: id }).lean()).map((r) => r.note),
    expected: ["Second tab"],
  },
];

describe.each(writes)("stale saves: $name (D62)", (write) => {
  const send = (token, url, body) => request(app)[write.method](url).set(auth(token)).send(body);
  const bodiesFor = async () =>
    typeof write.bodies === "function" ? write.bodies() : write.bodies;

  it("two clients load the same version: the first saves, the second gets 409 and writes nothing; after a reload it saves", async () => {
    const { token } = await loginAs("project_manager");
    const id = await write.setup(token);
    const url = write.url(id);
    const [firstBody, secondBody] = await bodiesFor();
    const loaded = await currentVersion(url); // both tabs open the page

    const first = await send(token, url, { ...firstBody, version: loaded });
    expect(first.status).toBeLessThan(300);

    const before = await snapshot();
    const second = await send(token, url, { ...secondBody, version: loaded });
    expect(second.status).toBe(409);
    expect(second.body).toEqual(STALE);
    expect(await snapshot()).toBe(before);

    // Reload: the second client gets the new version and its save goes through.
    const reloaded = await currentVersion(url);
    expect(reloaded).not.toEqual(loaded);
    const retry = await send(token, url, { ...secondBody, version: reloaded });
    expect(retry.status).toBeLessThan(300);
    expect(await write.saved(id)).toEqual(write.expected);
  });

  it("a missing version → 400, nothing written", async () => {
    const { token } = await loginAs("project_manager");
    const id = await write.setup(token);
    const [body] = await bodiesFor();
    const before = await snapshot();

    const res = await send(token, write.url(id), body);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/version is required/);
    expect(await snapshot()).toBe(before);
  });

  it("two saves of the same version at the same moment: exactly one wins", async () => {
    const { token } = await loginAs("project_manager");
    const id = await write.setup(token);
    const url = write.url(id);
    const [firstBody, secondBody] = await bodiesFor();
    const loaded = await currentVersion(url);

    const results = await Promise.all([
      send(token, url, { ...firstBody, version: loaded }),
      send(token, url, { ...secondBody, version: loaded }),
    ]);

    expect(results.map((r) => r.status < 300).filter(Boolean)).toHaveLength(1);
    expect(results.find((r) => r.status >= 300).body).toEqual(STALE);
  });
});

describe("table save responses carry the new revision (D62)", () => {
  it("GET returns 0 before the first save; each bulk save returns and stores the next one", async () => {
    const { token } = await loginAs("project_manager");
    const project = await createProject({ stage: "assessment_approved" });
    const url = `/api/v1/projects/${project._id}/management`;

    const read = await request(app)
      .get(`/api/v1/management/project/${project._id}`)
      .set(auth(token));
    expect(read.body.version).toBe(0);

    const saved = await request(app)
      .put(url)
      .set(auth(token))
      .send({ version: 0, rows: [{ activity_description: "Dig" }] });
    expect(saved.body.version).toBe(1);
    const again = await request(app).put(url).set(auth(token)).send({ version: 1, rows: [] });
    expect(again.body.version).toBe(2);
    const reread = await request(app)
      .get(`/api/v1/management/project/${project._id}`)
      .set(auth(token));
    expect(reread.body.version).toBe(2);
  });

  it("a refused save (400 row error, 409 gate) leaves the revision as it was", async () => {
    const { token } = await loginAs("project_manager");
    const project = await createProject({ stage: "assessment_approved" });
    const url = `/api/v1/projects/${project._id}/mitigation`;

    const invalid = await request(app)
      .put(url)
      .set(auth(token))
      .send({ version: 0, rows: [{ notes: "no description" }] });
    expect(invalid.status).toBe(400);
    expect(await currentVersion(url)).toBe(0);

    const ok = await request(app)
      .put(url)
      .set(auth(token))
      .send({ version: 0, rows: [{ output_description: "Network" }] });
    expect(ok.status).toBe(200);
  });

  it("revisions are per project and per table", async () => {
    const { token } = await loginAs("project_manager");
    const a = await createProject({ stage: "assessment_approved" });
    const b = await createProject({ stage: "assessment_approved" });
    await request(app)
      .put(`/api/v1/projects/${a._id}/management`)
      .set(auth(token))
      .send({ version: 0, rows: [] });

    expect(await currentVersion(`/api/v1/projects/${a._id}/management`)).toBe(1);
    expect(await currentVersion(`/api/v1/projects/${a._id}/mitigation`)).toBe(0);
    expect(await currentVersion(`/api/v1/projects/${b._id}/management`)).toBe(0);
  });

  it("deleting a project removes its revisions", async () => {
    const { token } = await loginAs("admin");
    const project = await createProject({ stage: "new" });
    await TableRevision.create({ project: project._id, table: "management", revision: 3 });

    const res = await request(app).delete(`/api/v1/projects/${project._id}`).set(auth(token));

    expect(res.status).toBe(204);
    expect(await TableRevision.countDocuments()).toBe(0);
  });
});

describe("submit carries the version; approve/reject don't (D62)", () => {
  it("a stale submit → 409 and the record stays draft", async () => {
    const { token } = await loginAs("project_manager");
    const id = await draftScreening(token);
    const url = `/api/v1/screenings/${id}`;
    const loaded = await currentVersion(url);
    await request(app)
      .put(url)
      .set(auth(token))
      .send({ version: loaded, category_reason: "Edited in another tab" });

    const res = await request(app)
      .patch(`${url}/submit`)
      .set(auth(token))
      .send({ version: loaded });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("STALE_VERSION");
    expect((await Screening.findById(id)).status).toBe("draft");
  });

  it("a stale assessment submit → 409 before the required-field check", async () => {
    const { token } = await loginAs("project_manager");
    const id = await draftAssessment(token);
    const url = `/api/v1/assessments/${id}`;
    const loaded = await currentVersion(url);
    await request(app).put(url).set(auth(token)).send({ version: loaded, description: "" });

    const res = await request(app)
      .patch(`${url}/submit`)
      .set(auth(token))
      .send({ version: loaded });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("STALE_VERSION");
  });

  it("an editor whose screening was rejected meanwhile is told to reload, then can edit", async () => {
    const editor = await loginAs("project_manager");
    const specialist = await loginAs("environmental_specialist");
    const id = await draftScreening(editor.token);
    const url = `/api/v1/screenings/${id}`;
    await request(app)
      .patch(`${url}/submit`)
      .set(auth(editor.token))
      .send({ version: await currentVersion(url) });
    const loaded = await currentVersion(url); // the editor's page shows "submitted"

    // Reject needs no version; it moves the record on.
    const rejected = await request(app)
      .patch(`${url}/reject`)
      .set(auth(specialist.token))
      .send({ reject_reason: "Fix it" });
    expect(rejected.status).toBe(200);

    const stale = await request(app)
      .put(url)
      .set(auth(editor.token))
      .send({ version: loaded, category_reason: "x" });
    expect(stale.body.code).toBe("STALE_VERSION");

    const fresh = await request(app)
      .put(url)
      .set(auth(editor.token))
      .send({ version: await currentVersion(url), category_reason: "Fixed" });
    expect(fresh.status).toBe(200);
  });

  it("a version that is not a date → 400", async () => {
    const { token } = await loginAs("project_manager");
    const project = await createProject();
    const res = await request(app)
      .put(`/api/v1/projects/${project._id}`)
      .set(auth(token))
      .send({ version: "yesterday", title: "x" });
    expect(res.status).toBe(400);
  });
});
