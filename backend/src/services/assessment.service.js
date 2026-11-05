const Assessment = require("../models/assessment.model");
const AssessmentMethod = require("../models/assessmentMethod.model");
const CommunityConsultation = require("../models/communityConsultation.model");
const AssessmentImpactScore = require("../models/assessmentImpactScore.model");
const ImpactQuestion = require("../models/impactQuestion.model");
const ApiError = require("../utils/ApiError");
const assertSameProject = require("../utils/assertSameProject");
const { applyTransition, assertEditable, historyEntry } = require("../utils/statusTransition");
const { assertCurrentVersion, staleError, updateIfCurrent } = require("../utils/version");
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

const getWithChildren = async (id) => withChildren(await getAssessment(id));

// Loads an assessment for a content edit: still the version the client loaded (its `updatedAt`,
// D62 — checked first, so a user whose assessment changed meanwhile is told to reload), Tool 1
// approved, project not archived, and the assessment itself still draft or rejected.
const loadEditable = async (id, version) => {
  const assessment = await Assessment.findById(id);
  if (!assessment) throw new ApiError(404, "Assessment not found");
  assertCurrentVersion(assessment, version);
  await requireScreeningApproved(assessment.project);
  assertEditable(assessment);
  return assessment;
};

// Moves the assessment to a new version (with `$set` applied) only while it still has `version`
// and its status: two writes of the same version cannot both pass. Children writes (methods,
// consultations, scores) claim it before they write.
const claimVersion = async (assessment, version, $set = {}) => {
  const updated = await updateIfCurrent(
    Assessment,
    { _id: assessment._id, status: assessment.status },
    version,
    { $set }
  );
  if (!updated) throw staleError();
  return updated;
};

// Recomputes the per-level counts and total_project_impact from the saved scores.
const recalculate = async (assessmentId) => {
  const scores = await AssessmentImpactScore.find({ assessment: assessmentId }).select("level");
  const counts = Object.fromEntries(LEVELS.map((level) => [level, 0]));
  scores.forEach((score) => {
    counts[score.level] += 1;
  });
  const impact = PRIORITY.find((level) => counts[level] > 0) ?? null;
  // The score write already moved the version (claimVersion): the totals don't move it again.
  await Assessment.updateOne(
    { _id: assessmentId },
    { total_project_score: counts, total_project_impact: impact },
    { timestamps: false }
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

const updateAssessment = async (id, { version, ...payload }, updatedBy) => {
  const assessment = await loadEditable(id, version);
  assertSameProject(assessment, payload);

  const updateData = { ...payload };
  if (updatedBy && !assessment.officer) {
    updateData.officer = updatedBy;
  }

  const updated = await claimVersion(assessment, version, updateData);
  return populateAssessment(Assessment.findById(updated._id));
};

// Sets the level (and note) of the questions in the payload; questions not sent keep their
// level. Recalculates the total impact. Returns the assessment with its children (as
// getByProject), so the client gets the new version and totals in one answer.
const addScores = async (assessmentId, { version, scores: scoresPayload }) => {
  const assessment = await loadEditable(assessmentId, version);

  const questionIds = scoresPayload.map((s) => String(s.question));
  if (new Set(questionIds).size !== questionIds.length) {
    throw new ApiError(400, "Each question can only be scored once per payload");
  }
  const realCount = await ImpactQuestion.countDocuments({ _id: { $in: questionIds } });
  if (realCount !== questionIds.length) {
    throw new ApiError(400, "One or more scores reference an unknown impact question");
  }

  await claimVersion(assessment, version);
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
  return getWithChildren(assessmentId);
};

const transition = async (id, action, userId, options = {}) => {
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

// Required fields (D57) are checked when the assessment is submitted: a draft may leave any of
// them empty (D69). All four metadata fields are required at submit (D74 2).
const REQUIRED_AT_SUBMIT = [
  ["project_activity", "Project activity"],
  ["description", "Description"],
  ["environmental_setting", "Environmental setting"],
  ["legal_requirements", "Legal requirements"],
];

// "A", "A and B", "A, B and C"
const listOf = (labels) =>
  labels.length > 1 ? `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}` : labels[0];

const assertRequiredFilled = (assessment) => {
  const missing = REQUIRED_AT_SUBMIT.filter(([field]) => isEmpty(assessment[field])).map(
    ([, label]) => label
  );
  if (missing.length) {
    throw new ApiError(400, `Fill in ${listOf(missing)} before submitting`);
  }
};

// `version` = the `updatedAt` the client loaded (D62): a stale submit → 409 before the checks.
const submitAssessment = async (id, submittedBy, version) => {
  const assessment = await Assessment.findById(id).select(
    "project_activity description environmental_setting legal_requirements updatedAt"
  );
  if (!assessment) throw new ApiError(404, "Assessment not found");
  assertCurrentVersion(assessment, version);
  assertRequiredFilled(assessment);
  await assertAllQuestionsScored(id);
  return transition(id, "submit", submittedBy, { version });
};

const approveAssessment = async (id, approvedBy, recommendations) =>
  transition(id, "approve", approvedBy, { recommendations });

const rejectAssessment = async (id, rejectBy, rejectReason = null) =>
  transition(id, "reject", rejectBy, { rejectReason });

// Replaces a child list (methods, consultations) under a claimed version; returns the assessment
// with its children (as getByProject).
const replaceChildren = async (Model, assessmentId, version, items) => {
  const assessment = await loadEditable(assessmentId, version);
  await claimVersion(assessment, version);
  await Model.deleteMany({ assessment: assessmentId });
  if (items.length) {
    await Model.insertMany(items.map((item) => ({ ...item, assessment: assessmentId })));
  }
  return getWithChildren(assessmentId);
};

const replaceMethods = async (assessmentId, { version, methods }) =>
  replaceChildren(AssessmentMethod, assessmentId, version, methods);

const replaceConsultations = async (assessmentId, { version, consultations }) =>
  replaceChildren(CommunityConsultation, assessmentId, version, consultations);

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
