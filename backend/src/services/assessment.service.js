const Assessment = require("../models/assessment.model");
const AssessmentMethod = require("../models/assessmentMethod.model");
const CommunityConsultation = require("../models/communityConsultation.model");
const AssessmentImpactScore = require("../models/assessmentImpactScore.model");
const ApiError = require("../utils/ApiError");

const listAssessments = async () =>
  Assessment.find()
    .populate("project officer approved_by reject_by")
    .sort({ createdAt: -1 });

const getAssessment = async (id) => {
  const assessment = await Assessment.findById(id).populate(
    "project officer approved_by reject_by"
  );
  if (!assessment) throw new ApiError(404, "Assessment not found");
  return assessment;
};

const getByProject = async (projectId) => {
  const assessment = await Assessment.findOne({ project: projectId }).populate(
    "project officer approved_by reject_by"
  );
  if (!assessment) throw new ApiError(404, "Assessment not found for project");
  return assessment;
};

const createAssessment = async (payload, createdBy) => {
  const assessmentData = { ...payload };
  if (createdBy) {
    assessmentData.officer = createdBy;
  }
  return Assessment.create(assessmentData);
};

const updateAssessment = async (id, payload, updatedBy) => {
  // إذا كان status يتغير إلى submitted أو لم يكن officer موجوداً، نحدّث officer
  const assessment = await Assessment.findById(id);
  if (!assessment) throw new ApiError(404, "Assessment not found");
  
  const updateData = { ...payload };
  
  // إذا تغير status إلى submitted أو لم يكن officer موجوداً، نحدّث officer
  if (updatedBy && (payload.status === "submitted" || !assessment.officer)) {
    updateData.officer = updatedBy;
  }
  
  const updated = await Assessment.findByIdAndUpdate(id, updateData, {
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

  // حساب عدد كل مستوى
  const scoreCount = {
    negligible: 0,
    low: 0,
    medium: 0,
    high: 0,
    not_applicable: 0,
  };

  scores.forEach((score) => {
    if (scoreCount.hasOwnProperty(score.level)) {
      scoreCount[score.level]++;
    }
  });

  // اختيار total_project_impact حسب أولوية الفئة (وليس عدد النقاط)
  // أولوية: high > medium > low > negligible > not_applicable
  const priorityLevels = ["high", "medium", "low", "negligible", "not_applicable"];

  let impactLevel = null;

  for (const level of priorityLevels) {
    if (scoreCount[level] > 0) {
      impactLevel = level;
      break;
    }
  }

  // إذا لم يوجد أي مستوى له قيمة > 0 (حالة استثنائية جداً)
  if (!impactLevel) {
    impactLevel = "negligible"; // قيمة افتراضية
  }

  assessment.total_project_score = scoreCount;
  assessment.total_project_impact = impactLevel;
  await assessment.save();

  return assessment;
};

const setStatus = async (id, status, approvedBy, recommendations = null, rejectReason = null) => {
  const updateData = {
    status,
  };

  // في حالة الموافقة: تسجيل approved_by و recommendations
  if (status === "approved") {
    updateData.approved_by = approvedBy;
    if (recommendations) {
      updateData.recommendations = recommendations;
    }
  }

  // في حالة الرفض: تسجيل reject_by و reject_reason فقط
  if (status === "rejected") {
    updateData.reject_by = approvedBy;
    if (rejectReason) {
      updateData.reject_reason = rejectReason;
    }
  }

  const updated = await Assessment.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("project officer approved_by reject_by");

  if (!updated) throw new ApiError(404, "Assessment not found");
  return updated;
};

const approveAssessment = async (id, approvedBy, recommendations) => {
  return setStatus(id, "approved", approvedBy, recommendations, null);
};

const rejectAssessment = async (id, rejectBy, rejectReason = null) => {
  return setStatus(id, "rejected", rejectBy, null, rejectReason);
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
  approveAssessment,
  rejectAssessment,
};
