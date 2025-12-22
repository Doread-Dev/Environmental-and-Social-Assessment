const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/monitoring.service");

exports.getAll = asyncHandler(async (req, res) => {
  const data = await service.listMonitoring();
  res.json({ success: true, data });
});

exports.getByProject = asyncHandler(async (req, res) => {
  const data = await service.getByProject(req.params.projectId);
  res.json({ success: true, data });
});

exports.create = asyncHandler(async (req, res) => {
  const data = await service.createRecord(req.body);
  res.status(201).json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  const data = await service.updateRecord(req.params.id, req.body);
  res.json({ success: true, data });
});

exports.updateQuarter = asyncHandler(async (req, res) => {
  const { q } = req.params;
  const data = await service.updateQuarter(req.params.id, q, req.body.value);
  res.json({ success: true, data });
});

