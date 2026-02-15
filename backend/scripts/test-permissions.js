/**
 * اختبار صلاحيات الأدوار (Roles Permissions)
 * يشغّل الباك اند أولاً (npm run dev) ثم: node scripts/test-permissions.js
 * يستخدم أدمن ثم ينشئ حسابات بأدوار مختلفة ويختبر الصلاحيات.
 */
require("dotenv").config();

const BASE = process.env.BASE_URL || "http://localhost:3000";

const ADMIN = {
  email: process.env.ADMIN_EMAIL || "admin@example.com",
  password: process.env.ADMIN_PASSWORD || "Passw0rd!",
};

const TEST_USERS = [
  { role: "viewer", email: "test-viewer@example.com", password: "Passw0rd!", name: "Test Viewer" },
  { role: "program_manager", email: "test-pm@example.com", password: "Passw0rd!", name: "Test PM" },
  { role: "project_manager", email: "test-pj@example.com", password: "Passw0rd!", name: "Test PJ" },
  { role: "environmental_focal_point", email: "test-focal@example.com", password: "Passw0rd!", name: "Test Focal" },
];

async function request(method, path, body = null, token = null) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (token) opts.headers["Authorization"] = `Bearer ${token}`;
  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = { raw: text };
  }
  return { status: res.status, data };
}

async function login(email, password) {
  const res = await request("POST", "/api/v1/auth/login", { email, password });
  if (res.status !== 200 || !res.data?.data?.token) return null;
  return { token: res.data.data.token, user: res.data.data.user };
}

async function ensureUser(adminToken, { name, email, password, role }) {
  const reg = await request("POST", "/api/v1/auth/register", { name, email, password, role }, adminToken);
  if (reg.status === 201) return { created: true };
  const errMsg = reg.data?.message || reg.data?.error || "";
  if (reg.status === 400 && (errMsg.includes("already in use") || errMsg.includes("Email already in use")))
    return { created: false };
  throw new Error(`Register failed: ${reg.status} ${JSON.stringify(reg.data)}`);
}

async function getFirstProjectId() {
  const res = await request("GET", "/api/v1/projects");
  if (res.status !== 200 || !Array.isArray(res.data?.data)) return null;
  const list = res.data.data;
  return list.length ? list[0]._id : null;
}

// Fake ID for approve/reject; non-env_spec must get 403, env_spec may get 404/400
const FAKE_ID = "000000000000000000000000";

async function main() {
  console.log("Base URL:", BASE);
  console.log("---");

  const health = await request("GET", "/health");
  if (health.status !== 200) {
    console.log("FAIL: Health check", health.status);
    process.exitCode = 1;
    return;
  }
  console.log("OK: Health check 200\n");

  // 1. Login as admin (environmental_specialist)
  const adminSession = await login(ADMIN.email, ADMIN.password);
  if (!adminSession) {
    console.log("FAIL: Admin login failed. Check ADMIN_EMAIL / ADMIN_PASSWORD or use admin@example.com / Passw0rd!");
    process.exitCode = 1;
    return;
  }
  console.log("OK: Admin login (environmental_specialist)\n");

  // 2. Create test users (skip if already exist)
  for (const u of TEST_USERS) {
    try {
      const r = await ensureUser(adminSession.token, u);
      console.log(r.created ? `Created: ${u.role} (${u.email})` : `Exists:  ${u.role} (${u.email})`);
    } catch (e) {
      console.log("FAIL: Ensure user", u.role, e.message);
      process.exitCode = 1;
      return;
    }
  }

  const projectId = await getFirstProjectId();
  console.log(projectId ? `\nUsing project id for DELETE test: ${projectId}` : "\nNo projects for DELETE test (optional).");
  console.log("---\n");

  let failed = 0;

  // 3. Test each role (admin + test users)
  const rolesToTest = [
    { label: "environmental_specialist (admin)", email: ADMIN.email, password: ADMIN.password },
    ...TEST_USERS.map((u) => ({ label: u.role, email: u.email, password: u.password })),
  ];

  for (const { label, email, password } of rolesToTest) {
    const session = await login(email, password);
    if (!session) {
      console.log(`[${label}] FAIL: Login failed`);
      failed++;
      continue;
    }
    const role = session.user?.role || "?";
    console.log(`[${label}]`);

    // GET /users (كل الأدوار بما فيها viewer → 200)
    const usersRes = await request("GET", "/api/v1/users", null, session.token);
    if (usersRes.status !== 200) {
      console.log(`  FAIL: GET /users expected 200, got ${usersRes.status}`);
      failed++;
    } else {
      console.log("  OK: GET /users 200");
    }

    // POST /projects (viewer فقط → 403؛ الباقي → 201 أو 400)
    const postProj = await request("POST", "/api/v1/projects", { name: "PermTest", description: "x" }, session.token);
    if (role === "viewer") {
      if (postProj.status !== 403) {
        console.log(`  FAIL: Viewer POST /projects expected 403, got ${postProj.status}`);
        failed++;
      } else {
        console.log("  OK: Viewer POST /projects 403");
      }
    } else {
      if (postProj.status !== 201 && postProj.status !== 400) {
        console.log(`  (POST /projects ${postProj.status} - expected 201/400 for ${role})`);
      } else {
        console.log("  OK: POST /projects", postProj.status);
      }
    }

    // DELETE /projects (فقط environmental_specialist → 200/204/404؛ الباقي → 403)
    const delId = projectId || FAKE_ID;
    const delRes = await request("DELETE", `/api/v1/projects/${delId}`, null, session.token);
    if (role === "environmental_specialist") {
      if (delRes.status !== 200 && delRes.status !== 204 && delRes.status !== 404) {
        console.log(`  FAIL: env_spec DELETE /projects expected 200/204/404, got ${delRes.status}`);
        failed++;
      } else {
        console.log("  OK: DELETE /projects", delRes.status, "(env_specialist)");
      }
    } else {
      if (delRes.status !== 403) {
        console.log(`  FAIL: ${role} DELETE /projects expected 403, got ${delRes.status}`);
        failed++;
      } else {
        console.log("  OK: DELETE /projects 403");
      }
    }

    // POST /auth/register (بعد وجود مستخدم: environmental_specialist فقط → 201/400؛ الباقي → 403)
    const registerRes = await request(
      "POST",
      "/api/v1/auth/register",
      { name: "PermTestUser", email: `perm-test-${role}-${Date.now()}@example.com`, password: "Passw0rd!", role: "viewer" },
      session.token
    );
    if (role === "environmental_specialist") {
      if (registerRes.status !== 201 && registerRes.status !== 400) {
        console.log(`  FAIL: env_spec POST /register expected 201/400, got ${registerRes.status}`);
        failed++;
      } else {
        console.log("  OK: POST /register", registerRes.status, "(env_specialist)");
      }
    } else {
      if (registerRes.status !== 403) {
        console.log(`  FAIL: ${role} POST /register expected 403, got ${registerRes.status}`);
        failed++;
      } else {
        console.log("  OK: POST /register 403");
      }
    }

    // GET /reports/export (environmental_specialist و program_manager → 200؛ الباقي → 403)
    const exportRes = await request("GET", "/api/v1/reports/export", null, session.token);
    if (role === "environmental_specialist" || role === "program_manager") {
      if (exportRes.status !== 200 && exportRes.status !== 204) {
        console.log(`  (GET /reports/export ${exportRes.status} - expected 200/204 for ${role})`);
      } else {
        console.log("  OK: GET /reports/export", exportRes.status);
      }
    } else {
      if (exportRes.status !== 403) {
        console.log(`  FAIL: ${role} GET /reports/export expected 403, got ${exportRes.status}`);
        failed++;
      } else {
        console.log("  OK: GET /reports/export 403");
      }
    }

    // PATCH screenings/:id/approve (environmental_specialist فقط → 200/400/404؛ الباقي → 403)
    const screeningApproveRes = await request("PATCH", `/api/v1/screenings/${FAKE_ID}/approve`, {}, session.token);
    if (role === "environmental_specialist") {
      if (screeningApproveRes.status !== 200 && screeningApproveRes.status !== 400 && screeningApproveRes.status !== 404) {
        console.log(`  (PATCH screenings/approve ${screeningApproveRes.status} - env_spec)`);
      } else {
        console.log("  OK: PATCH screenings/approve", screeningApproveRes.status);
      }
    } else {
      if (screeningApproveRes.status !== 403) {
        console.log(`  FAIL: ${role} PATCH screenings/approve expected 403, got ${screeningApproveRes.status}`);
        failed++;
      } else {
        console.log("  OK: PATCH screenings/approve 403");
      }
    }

    // PATCH assessments/:id/approve (environmental_specialist فقط → 200/400/404؛ الباقي → 403)
    const assessmentApproveRes = await request("PATCH", `/api/v1/assessments/${FAKE_ID}/approve`, {}, session.token);
    if (role === "environmental_specialist") {
      if (assessmentApproveRes.status !== 200 && assessmentApproveRes.status !== 400 && assessmentApproveRes.status !== 404) {
        console.log(`  (PATCH assessments/approve ${assessmentApproveRes.status} - env_spec)`);
      } else {
        console.log("  OK: PATCH assessments/approve", assessmentApproveRes.status);
      }
    } else {
      if (assessmentApproveRes.status !== 403) {
        console.log(`  FAIL: ${role} PATCH assessments/approve expected 403, got ${assessmentApproveRes.status}`);
        failed++;
      } else {
        console.log("  OK: PATCH assessments/approve 403");
      }
    }

    console.log("");
  }

  console.log("---");
  if (failed > 0) {
    console.log("FAIL:", failed, "check(s) failed.");
    process.exitCode = 1;
  } else {
    console.log("Done. All permission checks passed.");
  }
}

main().catch((err) => {
  if (err.cause?.code === "ECONNREFUSED" || err.message === "fetch failed") {
    console.error("Error: Cannot reach backend at", BASE, "- تأكد من تشغيل الباك اند (npm run dev)");
  } else {
    console.error("Error:", err.message);
  }
  process.exitCode = 1;
});
