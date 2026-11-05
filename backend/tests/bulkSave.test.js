import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, mongoose, require } from "./helpers/app.js";
import { createProject, loginAs, seedLookups } from "./helpers/fixtures.js";

const ManagementActivity = require("../../src/models/managementActivity.model");
const MitigationPlan = require("../../src/models/mitigationPlan.model");
const MonitoringRecord = require("../../src/models/monitoringRecord.model");
const Indicator = require("../../src/models/indicator.model");

const auth = (token) => ({ Authorization: `Bearer ${token}` });

const put = async (url, body, role = "project_manager") => {
  const { token } = await loginAs(role);
  return request(app).put(url).set(auth(token)).send(body);
};

// Snapshot of a table, to prove a failed request wrote nothing.
const snapshot = async (Model, project) =>
  JSON.stringify(await Model.find({ project }).sort({ _id: 1 }).lean());

const tables = [
  {
    name: "management activities (Tool 3)",
    path: "management",
    Model: ManagementActivity,
    field: "activity_description",
  },
  {
    name: "mitigation plan (Tool 4)",
    path: "mitigation",
    Model: MitigationPlan,
    field: "output_description",
  },
];

describe.each(tables)("PUT /projects/:id/$path — $name (D32)", ({ path, Model, field }) => {
  const url = (project) => `/api/v1/projects/${project._id}/${path}`;
  const row = (text, extra = {}) => ({ [field]: text, ...extra });

  it("creates the rows, numbered by position, and returns the saved table", async () => {
    const project = await createProject({ stage: "assessment_approved" });

    const res = await put(url(project), { rows: [row("First"), row("Second")] });

    expect(res.status).toBe(200);
    expect(res.body.data.map((r) => [r[field], r.serial_number])).toEqual([
      ["First", 1],
      ["Second", 2],
    ]);
    const saved = await Model.find({ project: project._id }).lean();
    expect(saved).toHaveLength(2);
    saved.forEach((r) => expect(r.createdAt).toBeInstanceOf(Date));
  });

  it("updates, creates and deletes rows in one call, keeping ids of existing rows", async () => {
    const project = await createProject({ stage: "assessment_approved" });
    const kept = await Model.create({ project: project._id, ...row("Keep"), notes: "old" });
    const dropped = await Model.create({ project: project._id, ...row("Drop") });

    const res = await put(url(project), {
      rows: [row("New"), { _id: kept._id.toString(), ...row("Kept, edited") }],
    });

    expect(res.status).toBe(200);
    const rows = await Model.find({ project: project._id }).sort({ serial_number: 1 }).lean();
    expect(rows.map((r) => r[field])).toEqual(["New", "Kept, edited"]);
    expect(rows[1]._id.toString()).toBe(kept._id.toString());
    expect(rows[1].notes).toBe("old"); // fields not sent keep their value, like the row PUT
    expect(await Model.exists({ _id: dropped._id })).toBeNull();
  });

  it("an empty table deletes every row of this project only", async () => {
    const project = await createProject({ stage: "assessment_approved" });
    const other = await createProject({ stage: "assessment_approved" });
    await Model.create({ project: project._id, ...row("Mine") });
    await Model.create({ project: other._id, ...row("Theirs") });

    expect((await put(url(project), { rows: [] })).status).toBe(200);
    expect(await Model.countDocuments({ project: project._id })).toBe(0);
    expect(await Model.countDocuments({ project: other._id })).toBe(1);
  });

  it.each([
    ["a row without its description", (r) => [r.valid, { notes: "no description" }], /required/],
    [
      "a row with both a user and an external party (D55)",
      (r) => [r.valid, row("x", { responsible: r.userId, responsible_text: "NGO" })],
      /^Row 2: Responsible is either/,
    ],
    [
      "a responsible that is not an id",
      (r) => [r.valid, row("x", { responsible: "nobody" })],
      /^Row 2: /,
    ],
    [
      "a row id of another project",
      (r) => [r.valid, { _id: r.foreignId, ...row("x") }],
      /^Row 2: not a row of this project/,
    ],
    [
      "the same row twice",
      (r) => [
        { _id: r.ownId, ...row("a") },
        { _id: r.ownId, ...row("b") },
      ],
      /^Row 2: row sent twice/,
    ],
  ])("%s → 400, nothing written", async (_name, rows, message) => {
    const project = await createProject({ stage: "assessment_approved" });
    const other = await createProject({ stage: "assessment_approved" });
    const own = await Model.create({ project: project._id, ...row("Existing") });
    const foreign = await Model.create({ project: other._id, ...row("Foreign") });
    const { user } = await loginAs("viewer");
    const before = await snapshot(Model, project._id);

    const res = await put(url(project), {
      rows: rows({
        valid: row("Valid new row"),
        userId: user._id.toString(),
        ownId: own._id.toString(),
        foreignId: foreign._id.toString(),
      }),
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(message);
    expect(await snapshot(Model, project._id)).toBe(before);
    expect(await Model.countDocuments({ project: other._id })).toBe(1);
  });

  it("requires a rows array (400)", async () => {
    const project = await createProject({ stage: "assessment_approved" });
    expect((await put(url(project), {})).status).toBe(400);
  });

  it("is gated like the row endpoints: assessment approved (409), not archived (409)", async () => {
    const early = await createProject({ stage: "screening_approved" });
    const archived = await createProject({ stage: "assessment_approved", archived: true });

    const blocked = await put(url(early), { rows: [row("x")] });
    expect(blocked.status).toBe(409);
    expect(blocked.body.error).toMatch(/Tool 2 \(Assessment\) must be approved/);
    expect((await put(url(archived), { rows: [row("x")] })).status).toBe(409);
    expect(await Model.countDocuments()).toBe(0);
  });

  it("viewer → 403, unknown project → 404", async () => {
    const project = await createProject({ stage: "assessment_approved" });
    expect((await put(url(project), { rows: [] }, "viewer")).status).toBe(403);
    const unknown = { _id: new mongoose.Types.ObjectId() };
    expect((await put(url(unknown), { rows: [] })).status).toBe(404);
  });
});

describe("PUT /projects/:id/monitoring (D32)", () => {
  const url = (project) => `/api/v1/projects/${project._id}/monitoring`;

  const setup = async () => {
    await seedLookups();
    const [first, second, third] = await Indicator.find().sort({ _id: 1 }).limit(3);
    const project = await createProject({ stage: "semp_complete" });
    return { project, first, second, third };
  };

  it("upserts records by indicator; records not sent stay; values stay free text (D19)", async () => {
    const { project, first, second, third } = await setup();
    const existing = await MonitoringRecord.create({
      project: project._id,
      indicator: first._id,
      scores: { baseline: "10" },
      note: "keep",
    });
    const untouched = await MonitoringRecord.create({
      project: project._id,
      indicator: third._id,
      total: "unchanged",
    });

    const res = await put(url(project), {
      records: [
        { indicator: first._id.toString(), scores: { baseline: "10", Q1: "12 (approx.)" } },
        { indicator: second._id.toString(), total: "n/a", ranking: "low" },
      ],
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    const updated = await MonitoringRecord.findById(existing._id).lean();
    expect(updated.scores).toEqual({ baseline: "10", Q1: "12 (approx.)" });
    expect(updated.note).toBe("keep");
    expect(
      await MonitoringRecord.findOne({ project: project._id, indicator: second._id }).lean()
    ).toMatchObject({ total: "n/a", ranking: "low", createdAt: expect.any(Date) });
    expect((await MonitoringRecord.findById(untouched._id).lean()).total).toBe("unchanged");
  });

  it("ranking stays empty unless picked; null clears it (D69)", async () => {
    const { project, first, second } = await setup();
    await MonitoringRecord.create({ project: project._id, indicator: second._id, ranking: "high" });

    const res = await put(url(project), {
      records: [
        { indicator: first._id.toString(), total: "5" },
        { indicator: second._id.toString(), ranking: null },
      ],
    });

    expect(res.status).toBe(200);
    const byIndicator = (id) =>
      res.body.data.find((r) => String(r.indicator._id ?? r.indicator) === String(id));
    expect(byIndicator(first._id).ranking).toBeUndefined();
    expect(byIndicator(second._id).ranking).toBeNull();
  });

  it.each([
    ["an unknown indicator", (i) => [i.valid, { indicator: i.unknown }], /^Record 2: unknown/],
    [
      "the same indicator twice",
      (i) => [i.valid, { indicator: i.validId }],
      /^Record 2: indicator sent twice/,
    ],
    [
      "a user and an external party (D55)",
      (i) => [i.valid, { indicator: i.otherId, responsible: i.userId, responsible_text: "NGO" }],
      /^Record 2: Responsible is either/,
    ],
    ["an invalid ranking", (i) => [i.valid, { indicator: i.otherId, ranking: "huge" }], /ranking/],
  ])("%s → 400, nothing written", async (_name, records, message) => {
    const { project, first, second } = await setup();
    const { user } = await loginAs("viewer");

    const res = await put(url(project), {
      records: records({
        valid: { indicator: first._id.toString(), total: "1" },
        validId: first._id.toString(),
        otherId: second._id.toString(),
        unknown: new mongoose.Types.ObjectId().toString(),
        userId: user._id.toString(),
      }),
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(message);
    expect(await MonitoringRecord.countDocuments()).toBe(0);
  });

  it("is gated like the record endpoints: SEMP complete (409), not archived (409)", async () => {
    await seedLookups();
    const indicator = (await Indicator.findOne())._id.toString();
    const early = await createProject({ stage: "assessment_approved" });
    const archived = await createProject({ stage: "semp_complete", archived: true });

    const blocked = await put(url(early), { records: [{ indicator }] });
    expect(blocked.status).toBe(409);
    expect(blocked.body.error).toMatch(/Tools 3 and 4 must be complete/);
    expect((await put(url(archived), { records: [{ indicator }] })).status).toBe(409);
    expect(await MonitoringRecord.countDocuments()).toBe(0);
  });

  it("an empty list writes nothing; viewer → 403", async () => {
    const { project } = await setup();
    const res = await put(url(project), { records: [] });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect((await put(url(project), { records: [] }, "viewer")).status).toBe(403);
  });
});
