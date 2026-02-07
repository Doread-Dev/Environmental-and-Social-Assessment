const fs = require("fs").promises;
const path = require("path");
const Project = require("../models/project.model");
const Screening = require("../models/screening.model");
const Assessment = require("../models/assessment.model");
const AssessmentMethod = require("../models/assessmentMethod.model");
const CommunityConsultation = require("../models/communityConsultation.model");
const AssessmentImpactScore = require("../models/assessmentImpactScore.model");
const ManagementActivity = require("../models/managementActivity.model");
const MitigationPlan = require("../models/mitigationPlan.model");
const MonitoringRecord = require("../models/monitoringRecord.model");
const SempObjective = require("../models/sempObjective.model");
const SempTarget = require("../models/sempTarget.model");
const SempAction = require("../models/sempAction.model");
const Attachment = require("../models/attachment.model");
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

/**
 * Helper function to delete a file from filesystem
 * @param {string} filePath - Path to the file (can be absolute or relative)
 */
const deleteFile = async (filePath) => {
  try {
    // Check if path is absolute (starts with / on Unix or C:\ on Windows)
    const isAbsolute = path.isAbsolute(filePath);
    const fullPath = isAbsolute ? filePath : path.join(process.cwd(), filePath);
    
    await fs.unlink(fullPath);
  } catch (error) {
    // Ignore errors if file doesn't exist or already deleted
    if (error.code !== "ENOENT") {
      console.error(`Error deleting file ${filePath}:`, error.message);
    }
  }
};

const deleteProject = async (id) => {
  const project = await Project.findById(id);
  if (!project) throw new ApiError(404, "Project not found");

  // Step 1: Get all Assessments before deletion (we need their IDs for attachments)
  const assessments = await Assessment.find({ project: id });
  const assessmentIds = assessments.map((a) => a._id);

  // Step 2: Delete Assessment sub-entities
  await AssessmentMethod.deleteMany({ assessment: { $in: assessmentIds } });
  await CommunityConsultation.deleteMany({ assessment: { $in: assessmentIds } });
  await AssessmentImpactScore.deleteMany({ assessment: { $in: assessmentIds } });

  // Step 3: Delete Assessments
  await Assessment.deleteMany({ project: id });

  // Step 4: Get all SEMP Objectives before deletion
  const sempObjectives = await SempObjective.find({ project: id });
  const sempObjectiveIds = sempObjectives.map((o) => o._id);

  // Step 5: Delete SEMP sub-entities
  if (sempObjectiveIds.length > 0) {
    const sempTargets = await SempTarget.find({ objective: { $in: sempObjectiveIds } });
    const sempTargetIds = sempTargets.map((t) => t._id);

    if (sempTargetIds.length > 0) {
      await SempAction.deleteMany({ target: { $in: sempTargetIds } });
    }

    await SempTarget.deleteMany({ objective: { $in: sempObjectiveIds } });
  }

  // Step 6: Delete SEMP Objectives
  await SempObjective.deleteMany({ project: id });

  // Step 7: Get IDs before deletion (for attachments)
  const screenings = await Screening.find({ project: id });
  const screeningIds = screenings.map((s) => s._id);

  const monitoringRecords = await MonitoringRecord.find({ project: id });
  const monitoringIds = monitoringRecords.map((m) => m._id);

  // Step 8: Delete main records
  await Screening.deleteMany({ project: id });
  await ManagementActivity.deleteMany({ project: id });
  await MitigationPlan.deleteMany({ project: id });
  await MonitoringRecord.deleteMany({ project: id });

  // Step 9: Delete attachments and their files
  // Get all attachments related to this project
  const projectAttachments = await Attachment.find({ entity_type: "project", entity_id: id });
  const screeningAttachments = await Attachment.find({ entity_type: "screening", entity_id: { $in: screeningIds } });
  const assessmentAttachments = await Attachment.find({ entity_type: "assessment", entity_id: { $in: assessmentIds } });
  const monitoringAttachments = await Attachment.find({ entity_type: "monitoring", entity_id: { $in: monitoringIds } });

  // Delete files from filesystem
  const allAttachments = [
    ...projectAttachments,
    ...screeningAttachments,
    ...assessmentAttachments,
    ...monitoringAttachments,
  ];

  // Delete all files in parallel (with error handling)
  await Promise.allSettled(
    allAttachments.map((attachment) => deleteFile(attachment.file_path))
  );

  // Delete attachment records from database
  await Attachment.deleteMany({ entity_type: "project", entity_id: id });
  await Attachment.deleteMany({ entity_type: "screening", entity_id: { $in: screeningIds } });
  await Attachment.deleteMany({ entity_type: "assessment", entity_id: { $in: assessmentIds } });
  await Attachment.deleteMany({ entity_type: "monitoring", entity_id: { $in: monitoringIds } });

  // Step 10: Delete the project itself
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

