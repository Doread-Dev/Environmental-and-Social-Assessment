const Project = require("../models/project.model");
const Screening = require("../models/screening.model");
const Assessment = require("../models/assessment.model");
const AssessmentMethod = require("../models/assessmentMethod.model");
const CommunityConsultation = require("../models/communityConsultation.model");
const AssessmentImpactScore = require("../models/assessmentImpactScore.model");
const ManagementActivity = require("../models/managementActivity.model");
const MitigationPlan = require("../models/mitigationPlan.model");
const MonitoringRecord = require("../models/monitoringRecord.model");
const AuditLog = require("../models/auditLog.model");
const ApiError = require("../utils/ApiError");
const { assertProjectWritable } = require("./workflow.service");

// Archived projects are hidden unless asked for; `archived: true` lists only them (D17).
const listProjects = async ({ archived = false } = {}) => {
  return Project.find({ archived: archived ? true : { $ne: true } }).sort({ createdAt: -1 });
};

const getProject = async (id) => {
  const project = await Project.findById(id);
  if (!project) throw new ApiError(404, "Project not found");
  return project;
};

const createProject = async (payload) => {
  return Project.create(payload);
};

const updateProject = async (id, payload) => {
  await assertProjectWritable(id);
  const updated = await Project.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new ApiError(404, "Project not found");
  return updated;
};

const deleteProject = async (id) => {
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

  await removeProjectData(id);
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

  await Project.deleteOne({ _id: id });
};

// Admin only, archived projects only, approved work included; recorded in the audit log (D60).
const purgeProject = async (id, userId) => {
  const project = await Project.findById(id);
  if (!project) throw new ApiError(404, "Project not found");
  if (!project.archived) {
    throw new ApiError(409, "Only archived projects can be deleted permanently. Archive it first.");
  }

  const [screening, assessment] = await Promise.all([
    Screening.findOne({ project: id }, "status category_code"),
    Assessment.findOne({ project: id }, "status total_project_impact"),
  ]);

  // Written before the delete: a purge never happens without its record.
  await AuditLog.create({
    action: "project.purge",
    by: userId,
    target_type: "project",
    target_id: project._id,
    target_title: project.title,
    details: {
      location: project.location,
      archived_by: project.archived_by,
      archived_at: project.archived_at,
      screening_status: screening?.status ?? null,
      screening_category: screening?.category_code ?? null,
      assessment_status: assessment?.status ?? null,
      total_project_impact: assessment?.total_project_impact ?? null,
    },
  });

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

const archiveProject = async (id, userId) => setArchived(id, true, userId);

const restoreProject = async (id) => setArchived(id, false);

module.exports = {
  listProjects,
  archiveProject,
  restoreProject,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  purgeProject,
  removeProjectData,
};
