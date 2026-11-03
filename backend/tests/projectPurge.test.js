import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, mongoose, require } from "./helpers/app.js";
import { createProject, loginAs } from "./helpers/fixtures.js";

const Project = require("../../src/models/project.model");
const Screening = require("../../src/models/screening.model");
const Assessment = require("../../src/models/assessment.model");
const ManagementActivity = require("../../src/models/managementActivity.model");
const MitigationPlan = require("../../src/models/mitigationPlan.model");
const AuditLog = require("../../src/models/auditLog.model");

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const purge = (id, token) => request(app).delete(`/api/v1/projects/${id}/purge`).set(auth(token));

async function archivedProject(fields = {}) {
  const { user } = await loginAs("environmental_specialist");
  const project = await createProject({ stage: "semp_complete", ...fields });
  await Project.updateOne(
    { _id: project._id },
    { archived: true, archived_by: user._id, archived_at: new Date() }
  );
  return { project, archivedBy: user };
}

describe("DELETE /projects/:id/purge (D60)", () => {
  it("lets an admin delete an archived project with approved work, and logs it", async () => {
    const { user, token } = await loginAs("admin");
    const { project, archivedBy } = await archivedProject({ title: "Old network" });
    const other = await createProject({ stage: "screening_approved" });

    const res = await purge(project._id, token);

    expect(res.status).toBe(204);
    for (const Model of [Screening, Assessment, ManagementActivity, MitigationPlan]) {
      expect(await Model.exists({ project: project._id })).toBeNull();
    }
    expect(await Project.exists({ _id: project._id })).toBeNull();
    expect(await Screening.exists({ project: other._id })).not.toBeNull();

    const logs = await AuditLog.find().lean();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      action: "project.purge",
      target_type: "project",
      target_title: "Old network",
      details: {
        location: "Aleppo",
        screening_status: "approved",
        screening_category: "B",
        assessment_status: "approved",
      },
    });
    expect(logs[0].by.toString()).toBe(user._id.toString());
    expect(logs[0].target_id.toString()).toBe(project._id.toString());
    expect(logs[0].details.archived_by.toString()).toBe(archivedBy._id.toString());
  });

  it.each(["environmental_specialist", "project_manager", "viewer"])(
    "is admin only: %s gets 403 and nothing changes",
    async (role) => {
      const { project } = await archivedProject();
      const { token } = await loginAs(role);

      expect((await purge(project._id, token)).status).toBe(403);
      expect(await Project.exists({ _id: project._id })).not.toBeNull();
      expect(await AuditLog.countDocuments()).toBe(0);
    }
  );

  it("refuses a project that is not archived (409), deletes and logs nothing", async () => {
    const { token } = await loginAs("admin");
    const project = await createProject({ stage: "assessment_approved" });

    const res = await purge(project._id, token);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Archive it first/);
    expect(await Assessment.exists({ project: project._id })).not.toBeNull();
    expect(await AuditLog.countDocuments()).toBe(0);
  });

  it("returns 404 for an unknown project", async () => {
    const { token } = await loginAs("admin");
    const res = await purge(new mongoose.Types.ObjectId(), token);
    expect(res.status).toBe(404);
  });
});

describe("GET /audit-logs (D60)", () => {
  it("lists entries newest first, with who did it", async () => {
    const { user, token } = await loginAs("admin");
    const first = await archivedProject({ title: "First" });
    const second = await archivedProject({ title: "Second" });
    await purge(first.project._id, token);
    await purge(second.project._id, token);

    const res = await request(app).get("/api/v1/audit-logs").set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data.map((l) => l.target_title)).toEqual(["Second", "First"]);
    expect(res.body.data[0].by).toEqual({
      _id: user._id.toString(),
      name: user.name,
      role: "admin",
    });
  });

  it.each(["environmental_specialist", "viewer"])("is admin only: %s gets 403", async (role) => {
    const { token } = await loginAs(role);
    expect((await request(app).get("/api/v1/audit-logs").set(auth(token))).status).toBe(403);
  });
});
