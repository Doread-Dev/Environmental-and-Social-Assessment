const ApiError = require("../utils/ApiError");

// The one project-access check (D66a). Every route that reads or writes a project or anything in
// it goes through middlewares/projectAccess.js, which calls these two functions; a route-table
// test fails if a project-scoped route skips them.
//
// v2: every signed-in user may access every project, so both allow everything. v3 puts project
// membership behind them; nothing else has to change.

// Throws 404 (not 403: whether the project exists is not revealed) when the user may not access
// the project. Does not check that the project exists; the route does that as before.
const assertProjectAccess = async (_user, _projectId) => {};

// Mongo filter on Project for lists (project list, dashboard): {} = every project.
const projectFilterFor = async (_user) => ({});

const noAccess = () => new ApiError(404, "Project not found");

module.exports = { assertProjectAccess, projectFilterFor, noAccess };
