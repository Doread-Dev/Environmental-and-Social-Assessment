const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/mitigationPlan.service");

// The table in `data`, its revision next to it in `version` (D62).
exports.listByProject = asyncHandler(async (req, res) => {
  const { rows, version } = await service.listByProject(req.params.projectId);
  res.json({ success: true, data: rows, version });
});

exports.replaceForProject = asyncHandler(async (req, res) => {
  const { rows, version } = await service.replaceForProject(req.params.id, req.body, req.user);
  res.json({ success: true, data: rows, version });
});
