import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./helpers/app.js";
import { loginAs } from "./helpers/fixtures.js";

const ID = "000000000000000000000000";

// Attachments (D26), old SEMP tree (D27) and reports (D28) were removed in phase 1. Phase 5
// removed what the frontend no longer calls: the tool lists (GET /projects carries the
// summaries), the single lookups (GET /lookups), the row writes of Tools 3–5 (bulk saves, D32),
// the single method/consultation adds (PUT replaces the list) and calculate (totals are
// recalculated on every score change). Phase 6 moved user creation to POST /users (admin only).
// Phase 8 removed the separate method/consultation/score reads (embedded in the project read).
describe("removed endpoints", () => {
  it.each([
    ["post", "/api/v1/attachments"],
    ["post", "/api/v1/attachments/upload"],
    ["get", `/api/v1/attachments/${ID}`],
    ["get", "/api/v1/semp/objectives"],
    ["post", "/api/v1/semp/objectives"],
    ["post", "/api/v1/semp/targets"],
    ["post", "/api/v1/semp/actions"],
    ["get", "/api/v1/reports/export"],
    ["get", "/api/v1/reports/dashboard"],
    ["get", "/api/v1/screenings"],
    ["get", "/api/v1/assessments"],
    ["get", "/api/v1/monitoring"],
    ["get", "/api/v1/lookups/impact-categories"],
    ["get", "/api/v1/lookups/impact-questions"],
    ["get", "/api/v1/lookups/indicators"],
    ["get", "/api/v1/lookups/job-titles"],
    ["post", "/api/v1/management"],
    ["put", `/api/v1/management/${ID}`],
    ["delete", `/api/v1/management/${ID}`],
    ["post", "/api/v1/mitigation"],
    ["put", `/api/v1/mitigation/${ID}`],
    ["delete", `/api/v1/mitigation/${ID}`],
    ["post", "/api/v1/monitoring"],
    ["put", `/api/v1/monitoring/${ID}`],
    ["patch", `/api/v1/monitoring/${ID}/quarter/Q1`],
    ["post", `/api/v1/assessments/${ID}/methods`],
    ["post", `/api/v1/assessments/${ID}/consultations`],
    ["patch", `/api/v1/assessments/${ID}/calculate`],
    // phase 8 (D63 c): read with the assessment by project
    ["get", `/api/v1/assessments/${ID}/methods`],
    ["get", `/api/v1/assessments/${ID}/consultations`],
    ["get", `/api/v1/assessments/${ID}/scores`],
    ["post", "/api/v1/auth/register"],
  ])("%s %s returns 404", async (method, url) => {
    const { token } = await loginAs("environmental_specialist");

    const res = await request(app)[method](url).set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
