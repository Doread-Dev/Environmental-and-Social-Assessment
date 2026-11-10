// The places in the app where guidance can appear (D64 a). A place exists only where a page
// renders it; library documents link to places by `key`, never by tool number or order, so tools
// without a number or without a project fit the same way. A new tool = one entry here (and its
// page renders the Guidance button). Returned by GET /lookups; the frontend keeps no copy.
//
// `scope`: project (inside a project's workspace) or organization (no project).
// `locked`: the page opens in v3 (D48). Its place can already be chosen, so guidance is ready.

const PLACE_GROUPS = [
  { key: "project_workflow", label: "Project workflow" },
  { key: "project_support", label: "Project support" },
  { key: "organization", label: "Organization" },
];

const PLACES = [
  {
    key: "screening",
    label: "Screening – Tool 1",
    group: "project_workflow",
    scope: "project",
    locked: false,
  },
  {
    key: "assessment",
    label: "Assessment – Tool 2",
    group: "project_workflow",
    scope: "project",
    locked: false,
  },
  {
    key: "management",
    label: "Management activities – Tool 3",
    group: "project_workflow",
    scope: "project",
    locked: false,
  },
  {
    key: "mitigation",
    label: "Mitigation plan – Tool 4",
    group: "project_workflow",
    scope: "project",
    locked: false,
  },
  {
    key: "monitoring",
    label: "Monitoring – Tool 5",
    group: "project_workflow",
    scope: "project",
    locked: false,
  },
  {
    key: "semp_plan",
    label: "SEMP Plan",
    group: "project_support",
    scope: "project",
    locked: true,
  },
  {
    key: "stakeholder_awareness",
    label: "Stakeholder Awareness",
    group: "project_support",
    scope: "project",
    locked: true,
  },
  {
    key: "ghg_emissions",
    label: "GHG Emissions",
    group: "organization",
    scope: "organization",
    locked: true,
  },
  {
    key: "environmental_data",
    label: "Environmental Data Collection",
    group: "organization",
    scope: "organization",
    locked: true,
  },
];

const PLACE_KEYS = PLACES.map((place) => place.key);

// The steps of a project's workflow: also the sections of its Project documents page (D64 d).
const PROJECT_WORKFLOW_PLACE_KEYS = PLACES.filter((p) => p.group === "project_workflow").map(
  (p) => p.key
);

const isPlace = (key) => PLACE_KEYS.includes(key);

module.exports = { PLACE_GROUPS, PLACES, PLACE_KEYS, PROJECT_WORKFLOW_PLACE_KEYS, isPlace };
