const ApiError = require("./ApiError");

// Rejects an update that would move a project-owned record to another project (D58).
// Sending the same project id again is allowed (clients often send the whole record).
const assertSameProject = (record, payload) => {
  if (payload.project !== undefined && String(payload.project) !== String(record.project)) {
    throw new ApiError(400, "project cannot be changed");
  }
};

module.exports = assertSameProject;
