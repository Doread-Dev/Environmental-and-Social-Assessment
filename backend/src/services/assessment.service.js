const Assessment = require("../models/assessment.model");
const AssessmentMethod = require("../models/assessmentMethod.model");
const CommunityConsultation = require("../models/communityConsultation.model");
const AssessmentImpactScore = require("../models/assessmentImpactScore.model");
const ApiError = require("../utils/ApiError");

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

  // تحديد total_project_impact بناءً على أعلى عدد
  // أولوية: high > medium > low > negligible
  // not_applicable لا يُؤخذ بالحسبان إلا إذا كانت كل المستويات الأخرى = 0
  let maxLevel = null;
  let maxCount = -1;

  // فحص المستويات (بدون not_applicable)
  const levelsToCheck = ["negligible", "low", "medium", "high"];
  levelsToCheck.forEach((level) => {
    if (scoreCount[level] > maxCount) {
      maxCount = scoreCount[level];
      maxLevel = level;
    }
  });

  // إذا كانت كل المستويات = 0، استخدم not_applicable
  if (maxCount === 0 && scoreCount.not_applicable > 0) {
    maxLevel = "not_applicable";
  } else if (maxCount === 0) {
    // إذا كانت كل المستويات = 0 و not_applicable = 0، استخدم negligible كقيمة افتراضية
    maxLevel = "negligible";
  }

  // في حالة التعادل، اختر الأعلى حسب الأولوية
  if (maxCount > 0) {
    const priority = { high: 4, medium: 3, low: 2, negligible: 1 };
    let highestPriority = null;
    let highestPriorityValue = -1;

    levelsToCheck.forEach((level) => {
      if (
        scoreCount[level] === maxCount &&
        priority[level] > highestPriorityValue
      ) {
        highestPriorityValue = priority[level];
        highestPriority = level;
      }
    });

    if (highestPriority) {
      maxLevel = highestPriority;
    }
  }

  assessment.total_project_score = scoreCount;
  assessment.total_project_impact = maxLevel;
  assessment.is_complete = true;
  await assessment.save();

  return assessment;
};

const setStatus = async (id, status, approvedBy, recommendations = null) => {
  const updateData = {
    status,
    approved_by: approvedBy,
  };

  // إضافة recommendations فقط في حالة الموافقة
  if (status === "approved" && recommendations) {
    updateData.recommendations = recommendations;
  }

  const updated = await Assessment.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("project officer approved_by");

  if (!updated) throw new ApiError(404, "Assessment not found");
  return updated;
};

const approveAssessment = async (id, approvedBy, recommendations) => {
  return setStatus(id, "approved", approvedBy, recommendations);
};

const rejectAssessment = async (id, approvedBy) => {
  return setStatus(id, "rejected", approvedBy, null);
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
