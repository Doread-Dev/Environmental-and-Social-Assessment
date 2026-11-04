const mongoose = require("mongoose");
const access = require("../services/access.service");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// Route middleware for the one project-access check (D66a). Each project-scoped route has one of
// these; they find the project the request is about and ask access.service. Routes keep doing
// their own existence checks and responses: in v2 the check allows everyone, so nothing changes.
//
// The functions are called through the module object (access.assertProjectAccess) so tests can
// stub them.

const tag = (middleware, source) => {
  // Read by the route-table test (tests/projectAccess.test.js).
  middleware.projectAccess = source;
  return middleware;
};

const check = async (req, projectId) => {
  // A malformed id has no project to check; the route answers it (404 CastError, 400 Joi) as
  // before.
  if (!mongoose.isValidObjectId(projectId)) return;
  await access.assertProjectAccess(req.user, String(projectId));
};

// The project id is in the URL (/projects/:id/…, /screenings/project/:projectId).
const fromParam = (param) =>
  tag(
    asyncHandler(async (req, res, next) => {
      await check(req, req.params[param]);
      next();
    }),
    `param:${param}`
  );

// The project id is in the (validated) body: POST /screenings, POST /assessments.
const fromBody = (field) =>
  tag(
    asyncHandler(async (req, res, next) => {
      await check(req, req.body?.[field]);
      next();
    }),
    `body:${field}`
  );

// The URL names a record of the project (screening, assessment, monitoring record, file): load
// its project first. An unknown record → 404 with the record's own message; a malformed id is left
// to the route (CastError → 404), as before.
const fromRecord = (Model, param, notFound) =>
  tag(
    asyncHandler(async (req, res, next) => {
      const id = req.params[param];
      if (!mongoose.isValidObjectId(id)) return next();
      const record = await Model.findById(id).select("project").lean();
      if (!record) throw new ApiError(404, notFound);
      await check(req, record.project);
      next();
    }),
    `record:${Model.modelName}`
  );

// Lists (GET /projects, GET /dashboard): the filter of projects the user may see, in
// req.projectFilter, for the service to apply.
const list = () =>
  tag(
    asyncHandler(async (req, res, next) => {
      req.projectFilter = await access.projectFilterFor(req.user);
      next();
    }),
    "list"
  );

module.exports = { fromParam, fromBody, fromRecord, list };
