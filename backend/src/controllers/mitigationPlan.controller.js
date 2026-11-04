const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/mitigationPlan.service");

exports.listByProject = asyncHandler(async (req, res) => {
  const data = await service.listByProject(req.params.projectId);
  res.json({ success: true, data });
});

exports.replaceForProject = asyncHandler(async (req, res) => {
  const data = await service.replaceForProject(req.params.id, req.body.rows, req.user);
  res.json({ success: true, data });
});
