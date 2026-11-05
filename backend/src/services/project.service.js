const Project = require("../models/project.model");
const Screening = require("../models/screening.model");
const Assessment = require("../models/assessment.model");
const AssessmentMethod = require("../models/assessmentMethod.model");
const CommunityConsultation = require("../models/communityConsultation.model");
const AssessmentImpactScore = require("../models/assessmentImpactScore.model");
const ManagementActivity = require("../models/managementActivity.model");
const MitigationPlan = require("../models/mitigationPlan.model");
const MonitoringRecord = require("../models/monitoringRecord.model");
const TableRevision = require("../models/tableRevision.model");
const audit = require("./audit.service");
const ProjectFile = require("../models/projectFile.model");
const User = require("../models/user.model");
const { removeProjectFiles } = require("./projectFile.service");
const ApiError = require("../utils/ApiError");
const { assertCurrentVersion, staleError, updateIfCurrent } = require("../utils/version");
const {
  allowedActions,
  assertProjectWritable,
  computeWorkflow,
  loadWorkflowInputs,
  withWorkflowState,
} = require("./workflow.service");

const SORTS = {
  createdAt: { createdAt: -1 },
  updatedAt: { updatedAt: -1 },
  title: { title: 1 },
  start_date: { start_date: 1 },
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Projects with workflow state and allowed actions (D31). Archived projects are hidden unless
// asked for; `archived: true` lists only them (D17). `status` and `category` filter on the
// computed state, so they apply after it is loaded; without `limit` everything is one page.
// `accessFilter` comes from the project-access check (projectFilterFor, D66).
const listProjects = async (query, user, accessFilter) => {
  const { archived, search, status, category, sort, page, limit } = query;
  const filter = { $and: [accessFilter, { archived: archived ? true : { $ne: true } }] };
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ title: pattern }, { location: pattern }];
  }

  const projects = await Project.find(filter).sort(SORTS[sort]).lean();
  const items = (await withWorkflowState(projects, user)).filter(
    (item) =>
      (!status || item.workflow.status === status) &&
      (!category || item.screening?.category_code === category)
  );

  const total = items.length;
  if (!limit) {
    return { items, pagination: { page: 1, limit: null, total, pages: 1 } };
  }
  return {
    items: items.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  };
};

// Everything the project layout, sidebar, route guards and overview need, in one call (D31).
const getWorkspace = async (id, user) => {
  const project = await Project.findById(id)
    .populate({ path: "archived_by", select: "name role" })
    .lean();
  if (!project) throw new ApiError(404, "Project not found");

  const inputs = (await loadWorkflowInputs([project._id])).get(String(project._id));
  const workflow = computeWorkflow(inputs);
  return {
    project,
    workflow,
    allowed_actions: allowedActions(user, project, workflow),
    screening: inputs.screening,
    assessment: inputs.assessment,
    counts: {
      management_activities: inputs.activities.length,
      mitigation_plans: inputs.plans.length,
      monitoring_records: inputs.records.length,
    },
  };
};

const getProject = async (id) => {
  const project = await Project.findById(id);
  if (!project) throw new ApiError(404, "Project not found");
  return project;
};

// A project may end on the day it starts, never before (D74 1). On an update the date not sent is
// the stored one.
const assertDateOrder = (startDate, endDate) => {
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    throw new ApiError(400, "End date cannot be before the start date");
  }
};

const createProject = async (payload) => {
  assertDateOrder(payload.start_date, payload.end_date);
  return Project.create(payload);
};

// `version` = the `updatedAt` the client loaded (D62): a stale save → 409 STALE_VERSION.
const updateProject = async (id, { version, ...payload }) => {
  const project = await Project.findById(id);
  if (!project) throw new ApiError(404, "Project not found");
  assertCurrentVersion(project, version);
  await assertProjectWritable(id);
  assertDateOrder(payload.start_date ?? project.start_date, payload.end_date ?? project.end_date);
  const updated = await updateIfCurrent(Project, { _id: id, archived: { $ne: true } }, version, {
    $set: payload,
  });
  if (!updated) throw staleError();
  return updated;
};

// What a project delete or purge leaves in the audit log (D60, D65): the project as it was.
const projectSnapshot = async (project) => {
  const id = project._id;
  const [screening, assessment, activities, plans, records, files, archivedBy] = await Promise.all([
    Screening.findOne({ project: id }, "status category_code").lean(),
    Assessment.findOne({ project: id }, "status total_project_impact").lean(),
    ManagementActivity.countDocuments({ project: id }),
    MitigationPlan.countDocuments({ project: id }),
    MonitoringRecord.countDocuments({ project: id }),
    ProjectFile.countDocuments({ project: id }),
    project.archived_by ? User.findById(project.archived_by, "name").lean() : null,
  ]);
  return {
    title: project.title,
    location: project.location,
    archived: Boolean(project.archived),
    archived_by: project.archived_by ?? null,
    archived_by_name: archivedBy?.name ?? null,
    archived_at: project.archived_at ?? null,
    screening_status: screening?.status ?? null,
    screening_category: screening?.category_code ?? null,
    assessment_status: assessment?.status ?? null,
    total_project_impact: assessment?.total_project_impact ?? null,
    rows: {
      management_activities: activities,
      mitigation_plans: plans,
      monitoring_records: records,
    },
    files,
  };
};

const projectTarget = (project) => ({ type: "project", id: project._id, label: project.title });

const deleteProject = async (id, user) => {
  const project = await Project.findById(id);
  if (!project) throw new ApiError(404, "Project not found");

  // Approved work is a record to keep: such projects are archived, not deleted (D17).
  const approvedFilter = { project: id, status: "approved" };
  if ((await Screening.exists(approvedFilter)) || (await Assessment.exists(approvedFilter))) {
    throw new ApiError(
      409,
      "This project has approved work and cannot be deleted. Archive it instead."
    );
  }

  const snapshot = await projectSnapshot(project);
  await removeProjectData(id);
  await audit.record(user, "project.delete", {
    project,
    target: projectTarget(project),
    snapshot,
  });
  return true;
};

// Deletes a project and everything in it, without any checks. Callers decide whether it is
// allowed (deleteProject, purgeProject, scripts/seed-demo-project.js).
const removeProjectData = async (id) => {
  // Assessment sub-entities reference the assessment, not the project
  const assessments = await Assessment.find({ project: id }, "_id");
  const assessmentIds = assessments.map((a) => a._id);
  await AssessmentMethod.deleteMany({ assessment: { $in: assessmentIds } });
  await CommunityConsultation.deleteMany({ assessment: { $in: assessmentIds } });
  await AssessmentImpactScore.deleteMany({ assessment: { $in: assessmentIds } });
  await Assessment.deleteMany({ project: id });

  await Screening.deleteMany({ project: id });
  await ManagementActivity.deleteMany({ project: id });
  await MitigationPlan.deleteMany({ project: id });
  await MonitoringRecord.deleteMany({ project: id });
  await TableRevision.deleteMany({ project: id });

  await Project.deleteOne({ _id: id });
  // Files last, once the DB delete has succeeded (D47); failures are logged, never thrown.
  await removeProjectFiles(id);
};

// Admin only, archived projects only, approved work included; recorded in the audit log (D60).
const purgeProject = async (id, user) => {
  const project = await Project.findById(id);
  if (!project) throw new ApiError(404, "Project not found");
  if (!project.archived) {
    throw new ApiError(409, "Only archived projects can be deleted permanently. Archive it first.");
  }

  // Written before the delete: a purge never happens without its record (required: a failed
  // write stops the purge).
  await audit.record(
    user,
    "project.purge",
    { project, target: projectTarget(project), snapshot: await projectSnapshot(project) },
    { required: true }
  );

  await removeProjectData(id);
};

// Atomic, like the status transitions: only matches a project in the opposite state.
const setArchived = async (id, archived, userId) => {
  const update = archived
    ? { $set: { archived: true, archived_by: userId, archived_at: new Date() } }
    : { $set: { archived: false }, $unset: { archived_by: 1, archived_at: 1 } };
  const updated = await Project.findOneAndUpdate(
    { _id: id, archived: archived ? { $ne: true } : true },
    update,
    { new: true }
  ).populate({ path: "archived_by", select: "name role" });
  if (updated) return updated;

  if (!(await Project.exists({ _id: id }))) throw new ApiError(404, "Project not found");
  throw new ApiError(409, archived ? "Project is already archived" : "Project is not archived");
};

const archiveProject = async (id, user) => {
  const project = await setArchived(id, true, user._id);
  await audit.record(user, "project.archive", { project, target: projectTarget(project) });
  return project;
};

const restoreProject = async (id, user) => {
  const project = await setArchived(id, false);
  await audit.record(user, "project.restore", { project, target: projectTarget(project) });
  return project;
};

module.exports = {
  listProjects,
  getWorkspace,
  archiveProject,
  restoreProject,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  purgeProject,
  removeProjectData,
};
