const ApiError = require("./ApiError");

// Allowed "from" statuses for each transition of a screening or assessment (D1):
// draft|rejected → submitted → approved|rejected.
const TRANSITIONS = {
  submit: { from: ["draft", "rejected"], to: "submitted" },
  approve: { from: ["submitted"], to: "approved" },
  reject: { from: ["submitted"], to: "rejected" },
};

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
const applyTransition = async (Model, id, action, userId, options) => {
  const { from, to } = TRANSITIONS[action];
  const updated = await Model.findOneAndUpdate(
    { _id: id, status: { $in: from } },
    { status: to, ...actorFields(action, userId, options) },
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

module.exports = { TRANSITIONS, applyTransition };
