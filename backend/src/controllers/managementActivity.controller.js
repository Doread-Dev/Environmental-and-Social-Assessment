const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/managementActivity.service");

exports.listByProject = asyncHandler(async (req, res) => {
  const data = await service.listByProject(req.params.projectId);
  res.json({ success: true, data });
});

exports.create = asyncHandler(async (req, res) => {
  const data = await service.createActivity(req.body);
  res.status(201).json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  const data = await service.updateActivity(req.params.id, req.body);
  res.json({ success: true, data });
});

exports.remove = asyncHandler(async (req, res) => {
  await service.deleteActivity(req.params.id);
  res.status(204).send();
});

