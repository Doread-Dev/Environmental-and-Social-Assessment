const Project = require("../models/project.model");
const Screening = require("../models/screening.model");
const Assessment = require("../models/assessment.model");
const AssessmentMethod = require("../models/assessmentMethod.model");
const CommunityConsultation = require("../models/communityConsultation.model");
const AssessmentImpactScore = require("../models/assessmentImpactScore.model");
const ManagementActivity = require("../models/managementActivity.model");
const MitigationPlan = require("../models/mitigationPlan.model");
const MonitoringRecord = require("../models/monitoringRecord.model");
const ApiError = require("../utils/ApiError");

const listProjects = async () => {
  return Project.find().sort({ createdAt: -1 });
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

  await project.deleteOne();

  return true;
};

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
};
