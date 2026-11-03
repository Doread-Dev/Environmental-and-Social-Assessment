const ApiError = require("./ApiError");

// Allowed "from" statuses for each transition of a screening or assessment (D1):
// draft|rejected → submitted → approved|rejected.
const TRANSITIONS = {
  submit: { from: ["draft", "rejected"], to: "submitted" },
  approve: { from: ["submitted"], to: "approved" },
  reject: { from: ["submitted"], to: "rejected" },
};

// Screening/assessment content (and assessment methods, consultations, scores) can only be
// edited while draft or rejected; submitted and approved records are locked (D13).
const EDITABLE_STATUSES = ["draft", "rejected"];

const assertEditable = (record) => {
  if (!EDITABLE_STATUSES.includes(record.status)) {
    const name = record.constructor.modelName.toLowerCase();
    throw new ApiError(409, `Cannot edit a ${name} that is ${record.status}`);
  }
};

// Status history entry (D16). Creation is recorded as "created".
const historyEntry = (status, userId, note) => ({
  status,
  by: userId,
  at: new Date(),
  ...(note && { note }),
});

// Fields recording who did the transition.
const actorFields = (action, userId, { recommendations, rejectReason } = {}) => {
  if (action === "submit") return { officer: userId };
  if (action === "approve") {
    return { approved_by: userId, ...(recommendations && { recommendations }) };
  }
  return { reject_by: userId, reject_reason: rejectReason ?? "" };
};

// Applies the transition atomically: the update only matches while the record is still in an
// allowed "from" status, so two concurrent approve/reject calls cannot both succeed.
// Returns the updated query (so callers can populate it); throws 404 / 409.
const applyTransition = async (Model, id, action, userId, options = {}) => {
  const { from, to } = TRANSITIONS[action];
  const note = action === "reject" ? options.rejectReason : undefined;
  const updated = await Model.findOneAndUpdate(
    { _id: id, status: { $in: from } },
    {
      $set: { status: to, ...actorFields(action, userId, options) },
      $push: { status_history: historyEntry(to, userId, note) },
    },
    { new: true, runValidators: true }
  );
  if (updated) return updated;

  const current = await Model.findById(id).select("status");
  if (!current) throw new ApiError(404, `${Model.modelName} not found`);
  throw new ApiError(
    409,
    `Cannot ${action} a ${Model.modelName.toLowerCase()} that is ${current.status}`
  );
};

module.exports = { TRANSITIONS, EDITABLE_STATUSES, assertEditable, historyEntry, applyTransition };
