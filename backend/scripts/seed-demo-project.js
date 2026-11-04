// Creates a demo project that has gone through all five workflow tools
// (screening → assessment → SEMP tools 3 & 4 → monitoring), using the real HTTP API.
// Re-running first deletes every previous demo project (matched by title, archived ones too)
// straight in MongoDB: the API refuses to delete approved work (D17), and the admin purge endpoint
// is for real projects (D60). Dev-only: refuses to run with NODE_ENV=production.
//
// It also creates (or resets) one demo user per role, demo.<role>@example.com, through the admin
// user endpoints, and signs in as each one to replace the temporary password (D22) with
// DEMO_PASSWORD (default: SEED_PASSWORD). Passwords are never printed.
//
// And one reference library document, "[DEMO] Sample guidance" — a small PDF generated here (never
// a client file), linked to Tool 4 (mitigation) so the Guidance button shows (D64). It replaces the
// previous demo copy, which is removed straight in MongoDB like the demo project (no log entry).
//
// Usage (backend must be running, lookups seeded):
//   SEED_EMAIL=... SEED_PASSWORD=... [DEMO_PASSWORD=...] node scripts/seed-demo-project.js
// The account must be an admin (user management is admin only, D21).
require("dotenv").config();

if (process.env.NODE_ENV === "production") {
  console.error("seed-demo-project.js refuses to run with NODE_ENV=production.");
  process.exit(1);
}

const mongoose = require("mongoose");
const Project = require("../src/models/project.model");
const { removeProjectData } = require("../src/services/project.service");
const { removeDocumentsByTitle } = require("../src/services/library.service");
const { samplePdf } = require("./lib/samplePdf");

const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}/api/v1`;
const EMAIL = process.env.SEED_EMAIL;
const PASSWORD = process.env.SEED_PASSWORD;
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || PASSWORD;
const DEMO_TITLE = "[DEMO] Al-Salam Water Network Rehabilitation";
const DEMO_LIBRARY_TITLE = "[DEMO] Sample guidance";
const DEMO_USERS = [
  ["admin", "Demo Administrator"],
  ["environmental_specialist", "Demo Environmental Specialist"],
  ["program_manager", "Demo Program Manager"],
  ["project_manager", "Demo Project Manager"],
  ["environmental_focal_point", "Demo Environmental Focal Point"],
  ["viewer", "Demo Viewer"],
].map(([role, name]) => ({ role, name, email: `demo.${role}@example.com` }));

let token;

async function removePreviousDemos() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  try {
    const previous = await Project.find({ title: DEMO_TITLE }, "_id");
    for (const p of previous) {
      await removeProjectData(p._id);
      console.log(`Deleted previous demo project ${p._id}`);
    }
    const removed = await removeDocumentsByTitle(DEMO_LIBRARY_TITLE);
    if (removed > 0) console.log(`Deleted ${removed} previous demo library document(s)`);
  } finally {
    await mongoose.disconnect();
  }
}

async function call(method, path, body, as = token) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(as && { Authorization: `Bearer ${as}` }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return null;
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(`${method} ${path} -> ${res.status}: ${json.error || JSON.stringify(json)}`);
  }
  return json.data;
}

// Multipart upload (the library takes the file and its fields in one request).
async function upload(path, fields, file) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));
  form.append("file", new Blob([file.data], { type: "application/pdf" }), file.name);
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(`POST ${path} -> ${res.status}: ${json.error || JSON.stringify(json)}`);
  }
  return json.data;
}

async function seedLibraryDocument() {
  const pdf = samplePdf("Sample guidance (demo)", [
    "This is a generated sample for the demo project, not an official document.",
    "",
    "Library documents are organisation guidance, the same for every project.",
    "This one is linked to Tool 4 (Mitigation plan): open it from the",
    "Guidance button in the header of that page, without leaving it.",
    "",
    "Example measures for climate-related risks:",
    "- Raise pump housings above the recorded flood level.",
    "- Use pipe materials rated for higher summer temperatures.",
    "- Plan water trucking for supply cuts during heatwaves.",
  ]);
  const doc = await upload(
    "/library",
    {
      title: DEMO_LIBRARY_TITLE,
      description: "Generated sample PDF for the demo: shows the Guidance panel in Tool 4.",
      places: "mitigation",
    },
    { name: "demo-sample-guidance.pdf", data: pdf }
  );
  console.log(`Library: "${doc.title}" linked to Tool 4 (mitigation)`);
}

// Creates each demo user, or brings an existing one back to its role and active state, then gets
// a temporary password from the admin endpoints and swaps it for DEMO_PASSWORD as that user would.
async function seedDemoUsers(seedEmail) {
  const existing = await call("GET", "/users");
  for (const demo of DEMO_USERS) {
    if (demo.email === seedEmail) continue; // resetting the seed account would end this session
    const found = existing.find((u) => u.email === demo.email);
    let reset;
    if (found) {
      await call("PUT", `/users/${found._id}`, { name: demo.name, role: demo.role });
      if (!found.is_active) await call("PATCH", `/users/${found._id}/reactivate`);
      reset = await call("POST", `/users/${found._id}/reset-password`);
    } else {
      reset = await call("POST", "/users", demo);
    }
    const temporaryPassword = reset.temporary_password;
    const session = await call("POST", "/auth/login", {
      email: demo.email,
      password: temporaryPassword,
    });
    await call(
      "PUT",
      "/auth/password",
      { current_password: temporaryPassword, new_password: DEMO_PASSWORD },
      session.token
    );
  }
  console.log(`Demo users: ${DEMO_USERS.map((u) => u.email).join(", ")}`);
}

const LEVELS = ["negligible", "low", "medium", "high", "not_applicable"];

async function main() {
  if (!EMAIL || !PASSWORD) {
    throw new Error("Set SEED_EMAIL and SEED_PASSWORD (an admin account)");
  }

  const login = await call("POST", "/auth/login", { email: EMAIL, password: PASSWORD });
  token = login.token;
  const userId = login.user._id;
  if (login.user.role !== "admin") {
    throw new Error("SEED account must be an admin (user management is admin only)");
  }

  await seedDemoUsers(login.user.email);
  await removePreviousDemos();

  // Project
  const project = await call("POST", "/projects", {
    title: DEMO_TITLE,
    location: "Aleppo – Al-Salam district",
    start_date: "2026-01-15",
    end_date: "2027-06-30",
    project_component: "Water & Sanitation",
  });
  const projectId = project._id;
  console.log(`Project: ${projectId}`);

  // Tool 1 – Screening: draft → submitted → approved
  const screening = await call("POST", "/screenings", {
    project: projectId,
    category_code: "B",
    category_reason:
      "Rehabilitation of an existing water network within an urban area. Impacts are site-specific, mostly reversible and can be managed with standard mitigation measures.",
    potential_negative:
      "Dust and noise during excavation, temporary traffic disruption, construction waste, short water supply interruptions.",
    potential_positive:
      "Reliable access to safe drinking water for ~12,000 residents, reduced network leakage and lower waterborne disease risk.",
    screening_date: "2026-01-20",
  });
  await call("PATCH", `/screenings/${screening._id}/submit`);
  await call("PATCH", `/screenings/${screening._id}/approve`, {
    recommendations: "Proceed to a full environmental & social assessment (Tool 2).",
  });
  console.log("Tool 1 (screening): approved");

  // Tool 2 – Assessment: metadata, methods, consultations, scores, submit, approve.
  // Nothing is prefilled (D69): the demo types every field, as a user would in Tool 2. Every
  // question starts as Negligible (D54).
  const assessment = await call("POST", "/assessments", {
    project: projectId,
    project_activity: "Water network rehabilitation in the Al-Salam district",
    potential_negative_impact:
      "Dust and noise during excavation, temporary traffic disruption and water supply cut-offs.",
    potential_positive_impact:
      "Reliable access to safe drinking water and fewer network losses for the district.",
    description:
      "Excavation of trenches, removal of damaged pipes, installation of HDPE pipes, house connections and road reinstatement.",
    environmental_setting:
      "Dense residential area with a primary school and a small market along the pipe route.",
    legal_requirements:
      "Local municipality excavation permit; national drinking water quality standard; AKF environmental guidelines.",
  });
  const assessmentId = assessment._id;

  await call("PUT", `/assessments/${assessmentId}/methods`, [
    { method_type: "field_visits", details: "Site walk-through on 2026-02-03 and 2026-02-10" },
    {
      method_type: "technical_reports",
      details: "Water authority network condition survey (2025)",
    },
    {
      method_type: "akfs_guidelines",
      details: "AKF environmental screening & assessment guidelines",
    },
  ]);
  await call("PUT", `/assessments/${assessmentId}/consultations`, [
    {
      type: "village_meetings",
      participants: "Neighbourhood committee and 25 residents",
      notes: "Requested night-time work to be avoided near the school.",
    },
    {
      type: "community_interviews",
      participants: "Shop owners in the market street",
      notes: "Concern about access during trenching; agreed on phased works.",
    },
  ]);

  const lookups = await call("GET", "/lookups");
  const questions = lookups.impact_questions;
  // Only the questions that differ from Negligible: a few low/medium and one high, so the
  // total impact (recalculated by the backend) is meaningful.
  const scores = questions
    .map((q, i) => ({
      question: q._id,
      level: i === 3 ? "high" : i % 7 === 0 ? "medium" : LEVELS[i % 2],
      note: "",
    }))
    .filter((s) => s.level !== "negligible");
  await call("POST", `/assessments/${assessmentId}/scores`, scores);
  await call("PATCH", `/assessments/${assessmentId}/submit`);
  await call("PATCH", `/assessments/${assessmentId}/approve`, {
    recommendations: "Prepare SEMP with dust, noise and traffic management measures.",
  });
  console.log(`Tool 2 (assessment): approved, ${scores.length} questions above Negligible`);

  // Tool 3 – Management activities
  const activities = [
    {
      activity_description: "Trench excavation along residential streets",
      potential_impact: "Dust and noise affecting residents and the school",
      recommended_actions: ["Water spraying twice daily", "Work hours 8:00–16:00 only"],
      monitoring_requirements: "Daily site inspection log",
    },
    {
      activity_description: "Removal and disposal of old pipes",
      potential_impact: "Accumulation of construction waste",
      recommended_actions: ["Segregate waste", "Transport to approved municipal site"],
      monitoring_requirements: "Waste transport receipts",
    },
    {
      activity_description: "Temporary water supply cut-offs",
      potential_impact: "Households without water for several hours",
      recommended_actions: ["Notify residents 48h in advance", "Provide water trucking"],
      monitoring_requirements: "Complaint log review",
    },
  ];
  // The whole table in one request (D32), numbered by position.
  await call("PUT", `/projects/${projectId}/management`, {
    rows: activities.map((a, i) => ({
      // Responsible is a user or an external party (D55); the last row uses the contractor.
      ...(i === activities.length - 1
        ? { responsible_text: "Contractor site engineer" }
        : { responsible: userId }),
      notes: "",
      ...a,
    })),
  });
  console.log(`Tool 3 (management activities): ${activities.length} rows`);

  // Tool 4 – Mitigation plan
  const plans = [
    {
      output_description: "Rehabilitated distribution network (8 km)",
      potential_impact_and_significance: "Dust and noise – medium, temporary",
      mitigation_and_enhancement_measures:
        "Dust suppression, restricted working hours, noise barriers near school",
      monitoring: "Weekly dust/noise observation checklist",
      schedule: "Throughout construction (Feb–Dec 2026)",
    },
    {
      output_description: "Two rehabilitated pumping units",
      potential_impact_and_significance: "Oil spills from equipment – low",
      mitigation_and_enhancement_measures: "Drip trays and spill kits on site",
      monitoring: "Monthly equipment inspection",
      schedule: "Installation phase (Jun–Aug 2026)",
    },
    {
      output_description: "Community engagement on water use",
      potential_impact_and_significance: "Positive – improved water conservation",
      mitigation_and_enhancement_measures: "Awareness sessions with the neighbourhood committee",
      monitoring: "Attendance sheets",
      schedule: "Quarterly",
    },
  ];
  await call("PUT", `/projects/${projectId}/mitigation`, {
    rows: plans.map((p) => ({ responsible: userId, notes: "", ...p })),
  });
  console.log(`Tool 4 (mitigation plan): ${plans.length} rows`);

  // Tool 5 – Monitoring: one record per indicator, all quarters filled
  const { indicators } = lookups;
  const records = indicators.map((ind, i) => {
    const base = 10 + i;
    const q = [base - 1, base - 2, base - 2, base - 3];
    return {
      indicator: ind._id,
      scores: {
        baseline: String(base),
        Q1: String(q[0]),
        Q2: String(q[1]),
        Q3: String(q[2]),
        Q4: String(q[3]),
      },
      total: String(q.reduce((s, v) => s + v, 0)),
      final_assessment: "Within acceptable limits",
      ranking: LEVELS[i % 3],
      responsible: userId,
      note: "",
    };
  });
  await call("PUT", `/projects/${projectId}/monitoring`, { records });
  console.log(`Tool 5 (monitoring): ${indicators.length} indicator records, Q1–Q4 filled`);

  await seedLibraryDocument();

  console.log(`\nDone. Open http://localhost:5173/app/projects/${projectId}/overview`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
