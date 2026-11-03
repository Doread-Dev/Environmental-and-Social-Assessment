const ApiError = require("./ApiError");

const trimmed = (value) => (typeof value === "string" ? value.trim() : "");

// "Responsible" on Tools 3, 4 and 5 is an internal user OR a free-text external party, never
// both (D55). Setting one clears the other; a payload that sends neither key leaves both as
// they are. Both filled → 400.
const normalizeResponsible = (payload) => {
  const sendsUser = Object.hasOwn(payload, "responsible");
  const sendsText = Object.hasOwn(payload, "responsible_text");
  if (!sendsUser && !sendsText) return payload;

  const user = trimmed(payload.responsible);
  const text = trimmed(payload.responsible_text);
  if (user && text) {
    throw new ApiError(400, "Responsible is either a user or an external party, not both");
  }
  return { ...payload, responsible: user || null, responsible_text: user ? "" : text };
};

module.exports = normalizeResponsible;
