import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, require } from "./helpers/app.js";
import { ROLES, createProject, loginAs } from "./helpers/fixtures.js";

const { allowedActions, computeWorkflow } = require("../../src/services/workflow.service");
const { PERMISSIONS } = require("../../src/config/permissions");
const { EDITOR_ROLES, SPECIALIST_ROLES, ADMIN_ROLES } = require("../../src/config/roles");
const JobTitle = require("../../src/models/jobTitle.model");

const auth = (token) => ({ Authorization: `Bearer ${token}` });

const approved = { status: "approved" };
const semp = {
  activities: [{ activity_description: "Dig" }],
  plans: [{ output_description: "N" }],
};

// Role groups with identical rights (D11a): the three manager roles are "editor".
const GROUP = {
  admin: "admin",
  environmental_specialist: "specialist",
  program_manager: "editor",
  project_manager: "editor",
  environmental_focal_point: "editor",
  viewer: "viewer",
};

// Expected actions per project state and role group (D35, D28a). Viewers never get anything.
const MANAGE = ["project.edit", "project.archive", "project.delete"];
const states = [
  {
    name: "new project",
    inputs: {},
    specialist: [...MANAGE, "screening.create", "export"],
    editor: ["project.edit", "screening.create", "export"],
  },
  {
    name: "screening draft",
    inputs: { screening: { status: "draft" } },
    specialist: [...MANAGE, "screening.edit", "screening.submit", "export"],
    editor: ["project.edit", "screening.edit", "screening.submit", "export"],
  },
  {
    name: "screening submitted",
    inputs: { screening: { status: "submitted" } },
    specialist: [...MANAGE, "screening.approve", "screening.reject", "export"],
    editor: ["project.edit", "export"],
  },
  {
    name: "screening rejected",
    inputs: { screening: { status: "rejected" } },
    specialist: [...MANAGE, "screening.edit", "screening.submit", "export"],
    editor: ["project.edit", "screening.edit", "screening.submit", "export"],
  },
  {
    // Approved work: no delete any more, archive instead (D17).
    name: "screening approved",
    inputs: { screening: approved },
    specialist: ["project.edit", "project.archive", "assessment.create", "export"],
    editor: ["project.edit", "assessment.create", "export"],
  },
  {
    name: "assessment draft",
    inputs: { screening: approved, assessment: { status: "draft" } },
    specialist: [
      "project.edit",
      "project.archive",
      "assessment.edit",
      "assessment.submit",
      "export",
    ],
    editor: ["project.edit", "assessment.edit", "assessment.submit", "export"],
  },
  {
    name: "assessment submitted",
    inputs: { screening: approved, assessment: { status: "submitted" } },
    specialist: [
      "project.edit",
      "project.archive",
      "assessment.approve",
      "assessment.reject",
      "export",
    ],
    editor: ["project.edit", "export"],
  },
  {
    name: "assessment approved",
    inputs: { screening: approved, assessment: approved },
    specialist: ["project.edit", "project.archive", "semp.edit", "export"],
    editor: ["project.edit", "semp.edit", "export"],
  },
  {
    name: "SEMP complete",
    inputs: { screening: approved, assessment: approved, ...semp },
    specialist: ["project.edit", "project.archive", "semp.edit", "monitoring.edit", "export"],
    editor: ["project.edit", "semp.edit", "monitoring.edit", "export"],
  },
  {
    // Archived = read-only: restore (specialist), purge (admin only, D60), export.
    name: "archived with approved work",
    archived: true,
    inputs: { screening: approved, assessment: approved, ...semp },
    specialist: ["project.restore", "export"],
    admin: ["project.restore", "project.purge", "export"],
    editor: ["export"],
  },
  {
    name: "archived with nothing approved",
    archived: true,
    inputs: { screening: { status: "submitted" } },
    specialist: ["project.restore", "project.delete", "export"],
    admin: ["project.restore", "project.delete", "project.purge", "export"],
    editor: ["export"],
  },
];

const cases = states.flatMap((state) =>
  ROLES.map((role) => {
    const group = GROUP[role];
    const expected =
      group === "viewer" ? [] : (state[group] ?? (group === "admin" ? state.specialist : []));
    return { ...state, role, expected };
  })
);

describe("allowed actions per role × state (D35)", () => {
  it.each(cases)("$name — $role", ({ inputs, archived = false, role, expected }) => {
    const actions = allowedActions(role, { archived }, computeWorkflow(inputs));
    expect([...actions].sort()).toEqual([...expected].sort());
  });
});

describe("allowed actions in responses", () => {
  it("are computed for the caller's role", async () => {
    const project = await createProject({ stage: "assessment_approved", archived: true });
    const url = `/api/v1/projects/${project._id}/workspace`;

    const admin = await loginAs("admin");
    const viewer = await loginAs("viewer");
    const asAdmin = await request(app).get(url).set(auth(admin.token));
    const asViewer = await request(app).get(url).set(auth(viewer.token));

    expect(asAdmin.body.data.allowed_actions).toEqual([
      "project.restore",
      "project.purge",
      "export",
    ]);
    expect(asViewer.body.data.allowed_actions).toEqual([]);
  });
});

describe("GET /auth/me (D35)", () => {
  const expectedPermissions = (role) =>
    [
      EDITOR_ROLES.includes(role) && ["create_project", "edit", "export"],
      SPECIALIST_ROLES.includes(role) && ["approve", "delete_project", "archive_project"],
      // User management is admin only (D21).
      ADMIN_ROLES.includes(role) && ["manage_users", "purge_project", "read_audit_log"],
    ]
      .filter(Boolean)
      .flat()
      .sort();

  it.each(ROLES)("returns the user and the permissions of %s", async (role) => {
    const jobTitle = await JobTitle.create({ title_name: "Engineer" });
    const { user, token } = await loginAs(role, { job_title: jobTitle._id });

    const res = await request(app).get("/api/v1/auth/me").set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({
      _id: user._id.toString(),
      role,
      job_title: { title_name: "Engineer" },
    });
    expect(res.body.data.user).not.toHaveProperty("password");
    expect([...res.body.data.permissions].sort()).toEqual(expectedPermissions(role));
    expect(res.body.data.password_rules).toEqual({ min_length: 6 });
  });

  it("viewers have no export permission (D28a)", async () => {
    const { token } = await loginAs("viewer");
    const res = await request(app).get("/api/v1/auth/me").set(auth(token));
    expect(res.body.data.permissions).toEqual([]);
  });

  it("every permission is built from the route role lists", () => {
    const lists = [EDITOR_ROLES, SPECIALIST_ROLES, ADMIN_ROLES];
    Object.values(PERMISSIONS).forEach((roles) => expect(lists).toContain(roles));
  });

  it("requires a token (401)", async () => {
    expect((await request(app).get("/api/v1/auth/me")).status).toBe(401);
  });
});
