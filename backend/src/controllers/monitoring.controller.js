const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/monitoring.service");

exports.getOne = asyncHandler(async (req, res) => {
  const data = await service.getMonitoringRecord(req.params.id);
  res.json({ success: true, data });
});

exports.getByProject = asyncHandler(async (req, res) => {
  const data = await service.getByProject(req.params.projectId);
  res.json({ success: true, data });
});

exports.upsertForProject = asyncHandler(async (req, res) => {
  const data = await service.upsertForProject(req.params.id, req.body.records);
  res.json({ success: true, data });
});
