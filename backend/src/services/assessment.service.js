const Assessment = require("../models/assessment.model");
const AssessmentMethod = require("../models/assessmentMethod.model");
const CommunityConsultation = require("../models/communityConsultation.model");
const AssessmentImpactScore = require("../models/assessmentImpactScore.model");
const ImpactQuestion = require("../models/impactQuestion.model");
const Project = require("../models/project.model");
const Screening = require("../models/screening.model");
const ApiError = require("../utils/ApiError");
const assertSameProject = require("../utils/assertSameProject");
const { applyTransition, assertEditable, historyEntry } = require("../utils/statusTransition");
const { assertProjectWritable, requireScreeningApproved } = require("./workflow.service");

const LEVELS = ["negligible", "low", "medium", "high", "not_applicable"];
// total_project_impact is the highest level scored, not an average or a majority.
const PRIORITY = ["high", "medium", "low", "negligible", "not_applicable"];
const DEFAULT_LEVEL = "negligible"; // D54

const populateAssessment = (query) =>
  query.populate([
    { path: "project" },
    { path: "officer", populate: { path: "job_title" } },
    { path: "approved_by", populate: { path: "job_title" } },
    { path: "reject_by", populate: { path: "job_title" } },
    { path: "status_history.by", select: "name role" },
  ]);

const isEmpty = (value) => value == null || String(value).trim() === "";

const getAssessment = async (id) => {
  const assessment = await populateAssessment(Assessment.findById(id));
  if (!assessment) throw new ApiError(404, "Assessment not found");
  return assessment;
};

// null when the project has no assessment yet: "not started" is not an error (D34).
const getByProject = async (projectId) =>
  populateAssessment(Assessment.findOne({ project: projectId }));

// Loads an assessment for a content edit: Tool 1 approved, project not archived, and the
// assessment itself still draft or rejected.
const loadEditable = async (id) => {
  const assessment = await Assessment.findById(id);
  if (!assessment) throw new ApiError(404, "Assessment not found");
  await requireScreeningApproved(assessment.project);
  assertEditable(assessment);
  return assessment;
};

// Recomputes the per-level counts and total_project_impact from the saved scores.
const recalculate = async (assessmentId) => {
  const scores = await AssessmentImpactScore.find({ assessment: assessmentId }).select("level");
  const counts = Object.fromEntries(LEVELS.map((level) => [level, 0]));
  scores.forEach((score) => {
    counts[score.level] += 1;
  });
  const impact = PRIORITY.find((level) => counts[level] > 0) ?? null;
  await Assessment.updateOne(
    { _id: assessmentId },
    { total_project_score: counts, total_project_impact: impact }
  );
};

const createAssessment = async (payload, createdBy) => {
  await requireScreeningApproved(payload.project);
  if (await Assessment.exists({ project: payload.project })) {
    throw new ApiError(409, "An assessment already exists for this project");
  }

  // Prefill once, on create, only the fields the payload leaves empty (D53).
  const [project, screening] = await Promise.all([
    Project.findById(payload.project).select("project_component"),
    Screening.findOne({ project: payload.project }).select("potential_negative potential_positive"),
  ]);
  const data = { ...payload };
  if (isEmpty(data.project_activity)) data.project_activity = project.project_component;
  if (isEmpty(data.potential_negative_impact)) {
    data.potential_negative_impact = screening.potential_negative;
  }
  if (isEmpty(data.potential_positive_impact)) {
    data.potential_positive_impact = screening.potential_positive;
  }
  if (isEmpty(data.project_activity)) {
    throw new ApiError(400, "Project activity is required (the project has no component to use)");
  }

  const created = await Assessment.create({
    ...data,
    officer: createdBy,
    status_history: [historyEntry("created", createdBy)],
  });

  // Every question starts as Negligible; users change only what differs (D54).
  const questions = await ImpactQuestion.find().select("_id");
  await AssessmentImpactScore.insertMany(
    questions.map((q) => ({ assessment: created._id, question: q._id, level: DEFAULT_LEVEL }))
  );
  await recalculate(created._id);

  return populateAssessment(Assessment.findById(created._id));
};

const updateAssessment = async (id, payload, updatedBy) => {
  const assessment = await Assessment.findById(id);
  if (!assessment) throw new ApiError(404, "Assessment not found");
  assertSameProject(assessment, payload);
  await loadEditable(id);

  const updateData = { ...payload };
  if (updatedBy && !assessment.officer) {
    updateData.officer = updatedBy;
  }

  const updated = await populateAssessment(
    Assessment.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
  );
  if (!updated) throw new ApiError(404, "Assessment not found");
  return updated;
};

// Sets the level (and note) of the questions in the payload; questions not sent keep their
// level. Recalculates the total impact. Returns all scores of the assessment.
const addScores = async (assessmentId, scoresPayload) => {
  await loadEditable(assessmentId);

  const questionIds = scoresPayload.map((s) => String(s.question));
  if (new Set(questionIds).size !== questionIds.length) {
    throw new ApiError(400, "Each question can only be scored once per payload");
  }
  const realCount = await ImpactQuestion.countDocuments({ _id: { $in: questionIds } });
  if (realCount !== questionIds.length) {
    throw new ApiError(400, "One or more scores reference an unknown impact question");
  }

  await AssessmentImpactScore.bulkWrite(
    scoresPayload.map(({ question, level, note }) => ({
      updateOne: {
        filter: { assessment: assessmentId, question },
        update: { $set: { level, note: note ?? "" } },
        upsert: true,
      },
    }))
  );
  await recalculate(assessmentId);
  return AssessmentImpactScore.find({ assessment: assessmentId });
};

const transition = async (id, action, userId, options) => {
  const assessment = await Assessment.findById(id).select("project");
  if (!assessment) throw new ApiError(404, "Assessment not found");
  await assertProjectWritable(assessment.project);

  const updated = await applyTransition(Assessment, id, action, userId, options);
  return populateAssessment(Assessment.findById(updated._id));
};

// Safety check (D54): every distinct question has a level. Always true with the defaults.
const assertAllQuestionsScored = async (id) => {
  const [total, scored] = await Promise.all([
    ImpactQuestion.countDocuments(),
    AssessmentImpactScore.distinct("question", { assessment: id }),
  ]);
  if (scored.length < total) {
    throw new ApiError(
      400,
      `All ${total} impact questions need a level before submitting (${total - scored.length} missing)`
    );
  }
};

const submitAssessment = async (id, submittedBy) => {
  if (!(await Assessment.exists({ _id: id }))) throw new ApiError(404, "Assessment not found");
  await assertAllQuestionsScored(id);
  return transition(id, "submit", submittedBy);
};

const approveAssessment = async (id, approvedBy, recommendations) =>
  transition(id, "approve", approvedBy, { recommendations });

const rejectAssessment = async (id, rejectBy, rejectReason = null) =>
  transition(id, "reject", rejectBy, { rejectReason });

const listMethods = async (assessmentId) => {
  return AssessmentMethod.find({ assessment: assessmentId });
};

const replaceMethods = async (assessmentId, payload) => {
  await loadEditable(assessmentId);
  await AssessmentMethod.deleteMany({ assessment: assessmentId });
  if (!payload.length) return [];
  const docs = payload.map((item) => ({ ...item, assessment: assessmentId }));
  return AssessmentMethod.insertMany(docs);
};

const listConsultations = async (assessmentId) => {
  return CommunityConsultation.find({ assessment: assessmentId });
};

const replaceConsultations = async (assessmentId, payload) => {
  await loadEditable(assessmentId);
  await CommunityConsultation.deleteMany({ assessment: assessmentId });
  if (!payload.length) return [];
  const docs = payload.map((item) => ({ ...item, assessment: assessmentId }));
  return CommunityConsultation.insertMany(docs);
};

const listScores = async (assessmentId) => {
  return AssessmentImpactScore.find({ assessment: assessmentId });
};

module.exports = {
  getAssessment,
  getByProject,
  createAssessment,
  updateAssessment,
  addScores,
  submitAssessment,
  approveAssessment,
  rejectAssessment,
  listMethods,
  replaceMethods,
  listConsultations,
  replaceConsultations,
  listScores,
};
