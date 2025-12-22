const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/semp.service");

exports.getPlan = asyncHandler(async (req, res) => {
  const data = await service.listPlan(req.params.projectId);
  res.json({ success: true, data });
});

exports.createObjective = asyncHandler(async (req, res) => {
  const data = await service.createObjective(req.body);
  res.status(201).json({ success: true, data });
});

exports.updateObjective = asyncHandler(async (req, res) => {
  const data = await service.updateObjective(req.params.id, req.body);
  res.json({ success: true, data });
});

exports.createTarget = asyncHandler(async (req, res) => {
  const data = await service.createTarget(req.body);
  res.status(201).json({ success: true, data });
});

exports.updateTarget = asyncHandler(async (req, res) => {
  const data = await service.updateTarget(req.params.id, req.body);
  res.json({ success: true, data });
});

exports.createAction = asyncHandler(async (req, res) => {
  const data = await service.createAction(req.body);
  res.status(201).json({ success: true, data });
});

exports.updateAction = asyncHandler(async (req, res) => {
  const data = await service.updateAction(req.params.id, req.body);
  res.json({ success: true, data });
});

