/**
 * E2E chain test script (Node 18+).
 * Runs the full flow in order:
 *  Auth -> Project -> Screening -> Assessment (method/consult/score/calc)
 *  -> Management -> Mitigation -> SEMP (objective/target/action)
 *  -> Monitoring (create + quarter update)
 *  -> Attachment metadata
 *  -> Reports dashboard + export (status only, no file save)
 *
 * Usage:
 *   node scripts/e2e-chain.js
 *
 * The script is idempotent: it will register admin only if needed.
 */

const { execSync } = require("child_process");
const path = require("path");

const base = "http://localhost:3000";

async function req(method, path, { token, body } = {}) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(base + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

async function main() {
  const adminEmail = "admin@example.com";
  const adminPass = "Passw0rd!";

  // 0) Auth
  let login = await req("POST", "/api/v1/auth/login", {
    body: { email: adminEmail, password: adminPass },
  });
  if (login.status !== 200) {
    await req("POST", "/api/v1/auth/register", {
      body: {
        email: adminEmail,
        password: adminPass,
        name: "Admin Auto",
        role: "environmental_specialist",
      },
    });
    login = await req("POST", "/api/v1/auth/login", {
      body: { email: adminEmail, password: adminPass },
    });
  }
  if (login.status !== 200) throw new Error("Admin login failed");
  const token = login.data.data.token;
  const adminId = login.data.data.user._id;

  // Lookups (seed if empty)
  let indicators = await req("GET", "/api/v1/lookups/indicators");
  if (
    !Array.isArray(indicators.data?.data) ||
    indicators.data.data.length === 0
  ) {
    const seedPath = path.join(__dirname, "..", "src", "db", "seed.js");
    execSync(`node "${seedPath}"`, { stdio: "inherit" });
    indicators = await req("GET", "/api/v1/lookups/indicators");
  }
  const indicatorId = indicators.data?.data?.[0]?._id;
  if (!indicatorId) throw new Error("No indicators available; seed failed.");

  const impactQuestions = await req("GET", "/api/v1/lookups/impact-questions");
  const questionId =
    impactQuestions.data?.data?.[0]?._id || "0123456789abcdef01234567";

  // 1) Project
  const project = await req("POST", "/api/v1/projects", {
    token,
    body: {
      title: "E2E Chain Project",
      location: "Damascus",
      start_date: "2024-01-01",
      end_date: "2024-02-01",
      project_component: "Component A",
    },
  });
  if (project.status !== 201) throw new Error("Project create failed");
  const projectId = project.data.data._id;

  // 2) Screening
  const screening = await req("POST", "/api/v1/screenings", {
    token,
    body: {
      project: projectId,
      category_code: "A",
      category_reason: "Auto test",
      potential_negative: "Dust",
      potential_positive: "Jobs",
    },
  });
  const screeningId = screening.data.data?._id;
  await req("PATCH", `/api/v1/screenings/${screeningId}/approve`, { token });

  // 3) Assessment
  const assessment = await req("POST", "/api/v1/assessments", {
    token,
    body: {
      project: projectId,
      officer: adminId,
      project_activity: "Road repair",
      description: "Assessment desc",
      environmental_setting: "Urban",
      legal_requirements: "Local EIA",
    },
  });
  const assessmentId = assessment.data.data?._id;
  await req("POST", `/api/v1/assessments/${assessmentId}/methods`, {
    token,
    body: { method_type: "survey", details: "household" },
  });
  await req("POST", `/api/v1/assessments/${assessmentId}/consultations`, {
    token,
    body: { type: "meeting", participants: "community", notes: "concerns" },
  });
  await req("POST", `/api/v1/assessments/${assessmentId}/scores`, {
    token,
    body: [{ question: questionId, level: "medium", note: "dust medium" }],
  });
  await req("PATCH", `/api/v1/assessments/${assessmentId}/calculate`, {
    token,
  });

  // 4) Management Activity
  const management = await req("POST", "/api/v1/management", {
    token,
    body: {
      project: projectId,
      activity_description: "Water spraying",
      potential_impact: "low",
      monitoring_requirements: "weekly",
    },
  });

  // 5) Mitigation Plan
  const mitigation = await req("POST", "/api/v1/mitigation", {
    token,
    body: {
      project: projectId,
      output_description: "Waste handling",
      impact_level: "medium",
      mitigation_measures: "segregation",
    },
  });

  // 6) SEMP (objective -> target -> action)
  const obj = await req("POST", "/api/v1/semp/objectives", {
    token,
    body: { project: projectId, objective_text: "Reduce dust" },
  });
  const objId = obj.data.data?._id;
  const tgt = await req("POST", "/api/v1/semp/targets", {
    token,
    body: { objective: objId, target_text: "Weekly spraying" },
  });
  const tgtId = tgt.data.data?._id;
  await req("POST", "/api/v1/semp/actions", {
    token,
    body: { target: tgtId, action_text: "Spray water daily" },
  });

  // 7) Monitoring
  const mon = await req("POST", "/api/v1/monitoring", {
    token,
    body: {
      project: projectId,
      indicator: indicatorId,
      scores: { baseline: 1 },
      final_assessment: "medium",
      ranking: 2,
    },
  });
  if (mon.status !== 201)
    throw new Error(`Monitoring create failed: ${JSON.stringify(mon.data)}`);
  const monId = mon.data.data?._id;
  await req("PATCH", `/api/v1/monitoring/${monId}/quarter/Q1`, {
    token,
    body: { value: 3 },
  });

  // 8) Attachment metadata
  await req("POST", "/api/v1/attachments", {
    token,
    body: {
      entity_type: "project",
      entity_id: projectId,
      file_name: "placeholder.txt",
      file_path: "/tmp/placeholder.txt",
      file_type: "text/plain",
      file_size: 12,
    },
  });

  // 9) Reports
  const dash = await req("GET", "/api/v1/reports/dashboard", { token });
  const expProj = await req(
    "GET",
    "/api/v1/reports/export?type=projects&format=csv",
    { token }
  );
  const expMon = await req(
    "GET",
    `/api/v1/reports/export?type=monitoring&format=csv&projectId=${projectId}`,
    { token }
  );

  console.log("Done", {
    projectId,
    screeningId,
    assessmentId,
    managementId: management.data.data?._id,
    mitigationId: mitigation.data.data?._id,
    monitoringId: monId,
    dashboardStatus: dash.status,
    exportProjectsStatus: expProj.status,
    exportMonitoringStatus: expMon.status,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
