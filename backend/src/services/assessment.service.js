const Assessment = require("../models/assessment.model");
const AssessmentMethod = require("../models/assessmentMethod.model");
const CommunityConsultation = require("../models/communityConsultation.model");
const AssessmentImpactScore = require("../models/assessmentImpactScore.model");
const ApiError = require("../utils/ApiError");

const levelScore = { negligible: 0, low: 1, medium: 2, high: 3 };

const listAssessments = async () =>
  Assessment.find()
    .populate("project officer approved_by")
    .sort({ createdAt: -1 });

const getAssessment = async (id) => {
  const assessment = await Assessment.findById(id).populate(
    "project officer approved_by"
  );
  if (!assessment) throw new ApiError(404, "Assessment not found");
  return assessment;
};

const getByProject = async (projectId) => {
  const assessment = await Assessment.findOne({ project: projectId }).populate(
    "project officer approved_by"
  );
  if (!assessment) throw new ApiError(404, "Assessment not found for project");
  return assessment;
};

const createAssessment = async (payload) => Assessment.create(payload);

const updateAssessment = async (id, payload) => {
  const updated = await Assessment.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new ApiError(404, "Assessment not found");
  return updated;
};

const addMethod = async (assessmentId, payload) => {
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) throw new ApiError(404, "Assessment not found");
  return AssessmentMethod.create({ ...payload, assessment: assessmentId });
};

const addConsultation = async (assessmentId, payload) => {
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) throw new ApiError(404, "Assessment not found");
  return CommunityConsultation.create({ ...payload, assessment: assessmentId });
};

const addScores = async (assessmentId, scoresPayload) => {
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) throw new ApiError(404, "Assessment not found");
  // Replace all scores for this assessment
  await AssessmentImpactScore.deleteMany({ assessment: assessmentId });
  const docs = scoresPayload.map((s) => ({ ...s, assessment: assessmentId }));
  return AssessmentImpactScore.insertMany(docs);
};

const calculateImpact = async (assessmentId) => {
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) throw new ApiError(404, "Assessment not found");

  const scores = await AssessmentImpactScore.find({ assessment: assessmentId });
  if (!scores.length) throw new ApiError(400, "No scores to calculate");

  const numericScores = scores.map((s) => levelScore[s.level] ?? 0);
  const totalScore = numericScores.reduce((a, b) => a + b, 0);
  const avg = totalScore / numericScores.length;

  let level = "High";
  if (avg <= 1) level = "Low";
  else if (avg <= 2) level = "Medium";

  assessment.total_project_score = totalScore;
  assessment.total_project_impact = level.toLowerCase();
  assessment.is_complete = true;
  await assessment.save();

  return assessment;
};

module.exports = {
  listAssessments,
  getAssessment,
  getByProject,
  createAssessment,
  updateAssessment,
  addMethod,
  addConsultation,
  addScores,
  calculateImpact,
};
