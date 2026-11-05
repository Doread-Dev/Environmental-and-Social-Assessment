const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/monitoring.service");

exports.getOne = asyncHandler(async (req, res) => {
  const data = await service.getMonitoringRecord(req.params.id);
  res.json({ success: true, data });
});

// The records in `data`, the table's revision next to it in `version` (D62).
exports.getByProject = asyncHandler(async (req, res) => {
  const { records, version } = await service.getByProject(req.params.projectId);
  res.json({ success: true, data: records, version });
});

exports.upsertForProject = asyncHandler(async (req, res) => {
  const { records, version } = await service.upsertForProject(req.params.id, req.body);
  res.json({ success: true, data: records, version });
});
