// Creates a demo project that has gone through all five workflow tools
// (screening → assessment → SEMP tools 3 & 4 → monitoring), using the real HTTP API.
// Re-running deletes the previous demo project (matched by title) and recreates it.
//
// Usage (backend must be running, lookups seeded):
//   SEED_EMAIL=... SEED_PASSWORD=... node scripts/seed-demo-project.js
// The account must be an admin or environmental_specialist (needed to approve).
require("dotenv").config();

const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}/api/v1`;
const EMAIL = process.env.SEED_EMAIL;
const PASSWORD = process.env.SEED_PASSWORD;
const DEMO_TITLE = "[DEMO] Al-Salam Water Network Rehabilitation";

let token;

async function call(method, path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
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

const LEVELS = ["negligible", "low", "medium", "high", "not_applicable"];

async function main() {
  if (!EMAIL || !PASSWORD) {
    throw new Error("Set SEED_EMAIL and SEED_PASSWORD (an admin or environmental_specialist)");
  }

  const login = await call("POST", "/auth/login", { email: EMAIL, password: PASSWORD });
  token = login.token;
  const userId = login.user._id;
  if (!["admin", "environmental_specialist"].includes(login.user.role)) {
    throw new Error("SEED account must be an admin or environmental_specialist");
  }

  const existing = (await call("GET", "/projects")).filter((p) => p.title === DEMO_TITLE);
  for (const p of existing) {
    await call("DELETE", `/projects/${p._id}`);
    console.log(`Deleted previous demo project ${p._id}`);
  }

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

  // Tool 2 – Assessment: metadata, methods, consultations, scores, calculate, submit, approve
  const assessment = await call("POST", "/assessments", {
    project: projectId,
    project_activity: "Replacement of 8 km of distribution pipes and 2 pumping units",
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

  const questions = await call("GET", "/lookups/impact-questions");
  const scores = questions.map((q, i) => ({
    question: q._id,
    // Mostly low/negligible with a few medium and one high, so the total is meaningful
    level: i === 3 ? "high" : i % 7 === 0 ? "medium" : LEVELS[i % 2],
    note: "",
  }));
  await call("POST", `/assessments/${assessmentId}/scores`, scores);
  await call("PATCH", `/assessments/${assessmentId}/calculate`);
  await call("PUT", `/assessments/${assessmentId}`, {
    potential_negative_impact:
      "Dust, noise and traffic disruption during works; temporary interruption of water supply.",
    potential_positive_impact: "Improved water quality and continuity of supply.",
  });
  await call("PATCH", `/assessments/${assessmentId}/submit`);
  await call("PATCH", `/assessments/${assessmentId}/approve`, {
    recommendations: "Prepare SEMP with dust, noise and traffic management measures.",
  });
  console.log(`Tool 2 (assessment): approved with ${scores.length} scored questions`);

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
  for (const [i, a] of activities.entries()) {
    await call("POST", "/management", {
      project: projectId,
      serial_number: i + 1,
      responsible: userId,
      notes: "",
      ...a,
    });
  }
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
  for (const [i, p] of plans.entries()) {
    await call("POST", "/mitigation", {
      project: projectId,
      serial_number: i + 1,
      responsible: userId,
      notes: "",
      ...p,
    });
  }
  console.log(`Tool 4 (mitigation plan): ${plans.length} rows`);

  // Tool 5 – Monitoring: one record per indicator, all quarters filled
  const indicators = await call("GET", "/lookups/indicators");
  for (const [i, ind] of indicators.entries()) {
    const base = 10 + i;
    const q = [base - 1, base - 2, base - 2, base - 3];
    await call("POST", "/monitoring", {
      project: projectId,
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
    });
  }
  console.log(`Tool 5 (monitoring): ${indicators.length} indicator records, Q1–Q4 filled`);

  console.log(`\nDone. Open http://localhost:5173/app/projects/${projectId}/overview`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
