const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/report.service");

exports.dashboard = asyncHandler(async (req, res) => {
  const data = await service.getDashboardStats();
  res.json({ success: true, data });
});

exports.export = asyncHandler(async (req, res) => {
  const { type, projectId, format } = req.query;
  const result = await service.exportReport({ type, projectId, format });
  res.setHeader("Content-Type", result.contentType);
  res.setHeader("Content-Disposition", `attachment; filename=${result.filename}`);
  res.send(result.content);
});

