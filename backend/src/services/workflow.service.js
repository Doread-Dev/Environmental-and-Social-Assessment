const Project = require("../models/project.model");
const Screening = require("../models/screening.model");
const Assessment = require("../models/assessment.model");
const ManagementActivity = require("../models/managementActivity.model");
const MitigationPlan = require("../models/mitigationPlan.model");
const MonitoringRecord = require("../models/monitoringRecord.model");
const ApiError = require("../utils/ApiError");
const { can } = require("../config/permissions");

// Project workflow state (D30) and the gates built on it (D2, D12, D17): one source of truth.
// Order: Tool 1 Screening approved → Tool 2 Assessment approved → Tools 3 & 4 (SEMP) complete
// → Tool 5 Monitoring. Every screening category (A–F, including E) follows the same order.
//
// Step statuses: locked | not_started | in_progress | submitted | approved | rejected | completed.
// Screening and assessment map their record status (draft → in_progress); SEMP and monitoring
// have no record status and are derived from their rows.

const STEPS = ["screening", "assessment", "semp", "monitoring"];
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

const hasText = (value) => typeof value === "string" && value.trim() !== "";

const recordStatus = (record) => {
  if (!record) return "not_started";
  return record.status === "draft" ? "in_progress" : record.status;
};

// Tools 3 and 4 are each complete when they have at least one row and every row has its
// description. `status` (not_started | in_progress | completed) is shown per tool in the SEMP
// overview.
const tableSummary = (rows, field) => {
  const count = rows.length;
  const described = rows.filter((row) => hasText(row[field])).length;
  let status = "in_progress";
  if (count === 0) status = "not_started";
  else if (described === count) status = "completed";
  return { count, described, status };
};

const isTableComplete = ({ status }) => status === "completed";

const sempStatus = (assessmentStatus, management, mitigation) => {
  if (assessmentStatus !== "approved") return "locked";
  if (isTableComplete(management) && isTableComplete(mitigation)) return "completed";
  if (management.count > 0 || mitigation.count > 0) return "in_progress";
  return "not_started";
};

// Monitoring is in progress as soon as it has a record (a baseline alone counts) and completed
// once one record has all four quarters (owner, phase 4). Values are free text (D19): "filled"
// only means not empty.
const monitoringStep = (sempStepStatus, records) => {
  const quartersFilled = Object.fromEntries(
    QUARTERS.map((q) => [q, records.filter((r) => hasText(r.scores?.[q])).length])
  );
  const completeRecords = records.filter((r) => QUARTERS.every((q) => hasText(r.scores?.[q])));
  let status = "not_started";
  if (sempStepStatus !== "completed") status = "locked";
  else if (completeRecords.length > 0) status = "completed";
  else if (records.length > 0) status = "in_progress";
  return {
    tool: 5,
    status,
    records: records.length,
    complete_records: completeRecords.length,
    quarters_filled: quartersFilled,
  };
};

// Route keys match ROUTES in frontend/src/routes/routes.config.js.
const action = (step, label, description) => ({
  step,
  tool: { screening: 1, assessment: 2, semp: 3, monitoring: 5 }[step],
  route: step.toUpperCase(),
  label,
  description,
});

// Label and description of the next action while Tool 1 or Tool 2 is not approved yet.
const RECORD_ACTIONS = {
  screening: {
    not_started: ["Start Screening", "Begin the environmental screening of this project."],
    in_progress: [
      "Complete Screening",
      "Complete the environmental screening form to categorize project risk.",
    ],
    rejected: ["Revise Screening", "The screening was rejected. Review the feedback and resubmit."],
    submitted: ["Pending Approval", "The screening is pending approval from a reviewer."],
  },
  assessment: {
    not_started: ["Start Assessment", "Begin the environmental impact assessment."],
    in_progress: [
      "Continue Assessment",
      "Continue working on the environmental impact assessment.",
    ],
    rejected: [
      "Revise Assessment",
      "The assessment was rejected. Review the feedback and resubmit.",
    ],
    submitted: ["Pending Approval", "The assessment is pending approval from a reviewer."],
  },
};

const nextAction = (steps) => {
  for (const step of ["screening", "assessment"]) {
    const texts = RECORD_ACTIONS[step][steps[step].status];
    if (texts) return action(step, ...texts);
  }
  const { semp, monitoring } = steps;
  if (semp.status !== "completed") {
    return action(
      "semp",
      "Complete Management Plan (SEMP)",
      "The assessment is approved. Define the management activities and the mitigation plan."
    );
  }
  if (monitoring.status === "completed") {
    return action("monitoring", "Monitoring Complete", "Monitoring data has been recorded.");
  }
  return action(
    "monitoring",
    "Start Monitoring",
    "Begin monitoring and reporting environmental indicators."
  );
};

// Approved/completed steps count fully, steps being worked on (incl. submitted, rejected) half.
const STEP_WEIGHT = { approved: 1, completed: 1, in_progress: 0.5, submitted: 0.5, rejected: 0.5 };

const percentComplete = (steps) => {
  const total = STEPS.reduce((sum, step) => sum + (STEP_WEIGHT[steps[step].status] ?? 0), 0);
  return Math.round((total / STEPS.length) * 100);
};

const PROJECT_STATUSES = ["draft", "in_progress", "needs_action", "monitoring", "completed"];

// Overall project status (one of PROJECT_STATUSES).
const projectStatus = (steps) => {
  const statuses = STEPS.map((step) => steps[step].status);
  if (statuses.includes("rejected")) return "needs_action";
  if (statuses.every((s) => s === "approved" || s === "completed")) return "completed";
  if (steps.monitoring.status === "in_progress") return "monitoring";
  if (["not_started", "in_progress"].includes(steps.screening.status)) return "draft";
  return "in_progress";
};

// Pure: computes the workflow from a project's records (as loaded by loadWorkflowInputs).
const computeWorkflow = ({
  screening = null,
  assessment = null,
  activities = [],
  plans = [],
  records = [],
} = {}) => {
  const screeningStatus = recordStatus(screening);
  const assessmentStatus = screeningStatus === "approved" ? recordStatus(assessment) : "locked";
  const management = tableSummary(activities, "activity_description");
  const mitigation = tableSummary(plans, "output_description");
  const sempStepStatus = sempStatus(assessmentStatus, management, mitigation);

  const steps = {
    screening: { tool: 1, status: screeningStatus },
    assessment: { tool: 2, status: assessmentStatus },
    semp: {
      tools: [3, 4],
      status: sempStepStatus,
      management_activities: management,
      mitigation_plans: mitigation,
    },
    monitoring: monitoringStep(sempStepStatus, records),
  };
  const next = nextAction(steps);
  return {
    status: projectStatus(steps),
    current_step: next.step,
    percent_complete: percentComplete(steps),
    next_action: next,
    steps,
  };
};

// Fields kept for the screening/assessment summaries in list, dashboard and workspace responses.
const SCREENING_FIELDS = "project status category_code screening_date reject_reason updatedAt";
const ASSESSMENT_FIELDS =
  "project status total_project_impact total_project_score reject_reason updatedAt";

// Loads what computeWorkflow needs for many projects in a fixed number of queries (no
// per-project loop). Returns Map(projectId string → inputs).
const loadWorkflowInputs = async (projectIds) => {
  const filter = { project: { $in: projectIds } };
  const [screenings, assessments, activities, plans, records] = await Promise.all([
    Screening.find(filter).select(SCREENING_FIELDS).lean(),
    Assessment.find(filter).select(ASSESSMENT_FIELDS).lean(),
    ManagementActivity.find(filter).select("project activity_description").lean(),
    MitigationPlan.find(filter).select("project output_description").lean(),
    MonitoringRecord.find(filter).select("project scores").lean(),
  ]);

  const inputs = new Map(
    projectIds.map((id) => [
      String(id),
      { screening: null, assessment: null, activities: [], plans: [], records: [] },
    ])
  );
  const of = (row) => inputs.get(String(row.project));
  screenings.forEach((row) => (of(row).screening = row));
  assessments.forEach((row) => (of(row).assessment = row));
  activities.forEach((row) => of(row).activities.push(row));
  plans.forEach((row) => of(row).plans.push(row));
  records.forEach((row) => of(row).records.push(row));
  return inputs;
};

const getProjectWorkflow = async (projectId) => {
  const inputs = await loadWorkflowInputs([projectId]);
  return computeWorkflow(inputs.get(String(projectId)));
};

// What the given role may do on this project now (D35): role + workflow state + lock state.
// Archived projects are read-only (only restore, purge and export remain).
const allowedActions = (role, project, workflow) => {
  const { screening, assessment, semp, monitoring } = workflow.steps;
  const writable = !project.archived;
  const edit = writable && can(role, "edit");
  const review = writable && can(role, "approve");
  const editable = (status) => status === "in_progress" || status === "rejected";
  const hasApprovedWork = screening.status === "approved" || assessment.status === "approved";

  const actions = {
    "project.edit": edit,
    "project.archive": writable && can(role, "archive_project"),
    "project.restore": !writable && can(role, "archive_project"),
    "project.delete": can(role, "delete_project") && !hasApprovedWork,
    "project.purge": !writable && can(role, "purge_project"),
    "screening.create": edit && screening.status === "not_started",
    "screening.edit": edit && editable(screening.status),
    "screening.submit": edit && editable(screening.status),
    "screening.approve": review && screening.status === "submitted",
    "screening.reject": review && screening.status === "submitted",
    "assessment.create": edit && assessment.status === "not_started",
    "assessment.edit": edit && editable(assessment.status),
    "assessment.submit": edit && editable(assessment.status),
    "assessment.approve": review && assessment.status === "submitted",
    "assessment.reject": review && assessment.status === "submitted",
    "semp.edit": edit && semp.status !== "locked",
    "monitoring.edit": edit && monitoring.status !== "locked",
    export: can(role, "export"),
  };
  return Object.keys(actions).filter((name) => actions[name]);
};

// Plain project objects (lean) → list items with workflow state, screening/assessment summary and
// the role's allowed actions. Query count does not depend on the number of projects.
const withWorkflowState = async (projects, role) => {
  const inputs = await loadWorkflowInputs(projects.map((project) => project._id));
  return projects.map((project) => {
    const data = inputs.get(String(project._id));
    const workflow = computeWorkflow(data);
    return {
      ...project,
      screening: data.screening,
      assessment: data.assessment,
      workflow,
      allowed_actions: allowedActions(role, project, workflow),
    };
  });
};

// Gates. Every create/update/delete of project data calls one of these; reads never do. A broken
// workflow rule is a conflict with the project's state: 409.

// The project exists and is not archived (archived projects are read-only).
const assertProjectWritable = async (projectId) => {
  const project = await Project.findById(projectId).select("archived");
  if (!project) throw new ApiError(404, "Project not found");
  if (project.archived) {
    throw new ApiError(409, "This project is archived and read-only. Restore it to edit.");
  }
};

const LOCKED_MESSAGES = {
  assessment: "Tool 1 (Screening) must be approved before Tool 2 (Assessment).",
  semp: "Tool 2 (Assessment) must be approved before Tools 3 and 4 (Management Activities and Mitigation Plan).",
  monitoring:
    "Tools 3 and 4 must be complete (at least one row each, every row described) before Tool 5 (Monitoring).",
};

// Writable project and the step unlocked in the workflow; the first locked step names the rule.
const requireUnlocked = (...steps) => {
  return async (projectId) => {
    await assertProjectWritable(projectId);
    const workflow = await getProjectWorkflow(projectId);
    const locked = steps.find((step) => workflow.steps[step].status === "locked");
    if (locked) throw new ApiError(409, LOCKED_MESSAGES[locked]);
  };
};

const requireScreeningApproved = requireUnlocked("assessment");
const requireAssessmentApproved = requireUnlocked("semp");
const requireSempComplete = requireUnlocked("semp", "monitoring");

module.exports = {
  PROJECT_STATUSES,
  computeWorkflow,
  loadWorkflowInputs,
  getProjectWorkflow,
  allowedActions,
  withWorkflowState,
  assertProjectWritable,
  requireScreeningApproved,
  requireAssessmentApproved,
  requireSempComplete,
};
