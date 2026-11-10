import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, require } from "./helpers/app.js";
import {
  createProject,
  createUser,
  loginAs,
  seedLookups,
  withVersion,
} from "./helpers/fixtures.js";

const Indicator = require("../../src/models/indicator.model");

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// Responsible = an internal user OR free text, never both (D55). Tools 3–5 are saved per project
// (D32): `send` builds the request body.
const kinds = [
  {
    name: "management activity",
    path: "management",
    stage: "assessment_approved",
    send: (fields) => ({ rows: [{ activity_description: "Dig", ...fields }] }),
  },
  {
    name: "mitigation plan",
    path: "mitigation",
    stage: "assessment_approved",
    send: (fields) => ({ rows: [{ output_description: "Network", ...fields }] }),
  },
  {
    name: "monitoring record",
    path: "monitoring",
    stage: "semp_complete",
    send: (fields, indicator) => ({ records: [{ indicator, ...fields }] }),
  },
];

const responsibleId = (data) => data.responsible?._id ?? data.responsible ?? null;

describe.each(kinds)("$name responsible", ({ path, stage, send }) => {
  async function setup() {
    await seedLookups();
    const { token } = await loginAs("project_manager");
    const { user } = await createUser("environmental_focal_point");
    const project = await createProject({ stage });
    const indicator = String((await Indicator.findOne())._id);
    const save = async (fields, rowId) => {
      const body = send(fields, indicator);
      if (rowId) body.rows[0]._id = rowId;
      const res = await request(app)
        .put(`/api/v1/projects/${project._id}/${path}`)
        .set(auth(token))
        .send(await withVersion(`/api/v1/projects/${project._id}/${path}`, body));
      return { status: res.status, row: res.body.data?.[0], error: res.body.error };
    };
    return { user, save };
  }

  it("accepts a user", async () => {
    const { user, save } = await setup();
    const { status, row } = await save({ responsible: user._id.toString() });
    expect(status).toBe(200);
    expect(String(responsibleId(row))).toBe(user._id.toString());
    expect(row.responsible_text).toBe("");
  });

  it("accepts an external party as text", async () => {
    const { save } = await setup();
    const { status, row } = await save({ responsible_text: "  Contractor Ltd  " });
    expect(status).toBe(200);
    expect(row.responsible_text).toBe("Contractor Ltd");
    expect(responsibleId(row)).toBeNull();
  });

  it("rejects both (400)", async () => {
    const { user, save } = await setup();
    const { status, error } = await save({
      responsible: user._id.toString(),
      responsible_text: "Contractor",
    });
    expect(status).toBe(400);
    expect(error).toMatch(/Responsible is either a user or an external party/);
  });

  it("switching to text on update clears the user", async () => {
    const { user, save } = await setup();
    const created = await save({ responsible: user._id.toString() });

    // Tables update by row id; monitoring upserts by indicator
    const rowId = path === "monitoring" ? undefined : String(created.row._id);
    const { status, row } = await save({ responsible_text: "Municipality" }, rowId);

    expect(status).toBe(200);
    expect(row.responsible_text).toBe("Municipality");
    expect(responsibleId(row)).toBeNull();
  });
});
