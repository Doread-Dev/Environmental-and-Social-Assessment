const Assessment = require("../models/assessment.model");
const AssessmentMethod = require("../models/assessmentMethod.model");
const CommunityConsultation = require("../models/communityConsultation.model");
const AssessmentImpactScore = require("../models/assessmentImpactScore.model");
const ImpactQuestion = require("../models/impactQuestion.model");
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

// The assessment with its methods, consultations and scores embedded, so a page reads Tool 2 in
// one request (D63 c).
const withChildren = async (assessment) => {
  if (!assessment) return null;
  const [methods, consultations, scores] = await Promise.all([
    AssessmentMethod.find({ assessment: assessment._id }),
    CommunityConsultation.find({ assessment: assessment._id }),
    AssessmentImpactScore.find({ assessment: assessment._id }),
  ]);
  return { ...assessment.toObject(), methods, consultations, scores };
};

// null when the project has no assessment yet: "not started" is not an error (D34).
const getByProject = async (projectId) =>
  withChildren(await populateAssessment(Assessment.findOne({ project: projectId })));

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

  // Nothing is prefilled: the user types every field in Tool 2 (D69). Project activity and
  // description are required at submit, not at create.
  const created = await Assessment.create({
    ...payload,
    officer: createdBy,
    status_history: [historyEntry("created", createdBy)],
  });

  // Every question starts as Negligible; users change only what differs (D54).
  const questions = await ImpactQuestion.find().select("_id");
  await AssessmentImpactScore.insertMany(
    questions.map((q) => ({ assessment: created._id, question: q._id, level: DEFAULT_LEVEL }))
  );
  await recalculate(created._id);

  return withChildren(await populateAssessment(Assessment.findById(created._id)));
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

// Required fields (D57) are checked when the assessment is submitted: it may start empty (D69).
const REQUIRED_AT_SUBMIT = [
  ["project_activity", "Project activity"],
  ["description", "Description"],
];

const assertRequiredFilled = (assessment) => {
  const missing = REQUIRED_AT_SUBMIT.filter(([field]) => isEmpty(assessment[field])).map(
    ([, label]) => label
  );
  if (missing.length) {
    throw new ApiError(400, `Fill in ${missing.join(" and ")} before submitting`);
  }
};

const submitAssessment = async (id, submittedBy) => {
  const assessment = await Assessment.findById(id).select("project_activity description");
  if (!assessment) throw new ApiError(404, "Assessment not found");
  assertRequiredFilled(assessment);
  await assertAllQuestionsScored(id);
  return transition(id, "submit", submittedBy);
};

const approveAssessment = async (id, approvedBy, recommendations) =>
  transition(id, "approve", approvedBy, { recommendations });

const rejectAssessment = async (id, rejectBy, rejectReason = null) =>
  transition(id, "reject", rejectBy, { rejectReason });

const replaceMethods = async (assessmentId, payload) => {
  await loadEditable(assessmentId);
  await AssessmentMethod.deleteMany({ assessment: assessmentId });
  if (!payload.length) return [];
  const docs = payload.map((item) => ({ ...item, assessment: assessmentId }));
  return AssessmentMethod.insertMany(docs);
};

const replaceConsultations = async (assessmentId, payload) => {
  await loadEditable(assessmentId);
  await CommunityConsultation.deleteMany({ assessment: assessmentId });
  if (!payload.length) return [];
  const docs = payload.map((item) => ({ ...item, assessment: assessmentId }));
  return CommunityConsultation.insertMany(docs);
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
  replaceMethods,
  replaceConsultations,
};
