const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/report.service");

exports.dashboard = asyncHandler(async (req, res) => {
  const data = await service.getDashboardStats();
  res.json({ success: true, data });
});

exports.export = asyncHandler(async (req, res) => {
  const { type, projectId } = req.query;
  const result = await service.exportCsv({ type, projectId });
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=${result.filename}`);
  res.send(result.content);
});

