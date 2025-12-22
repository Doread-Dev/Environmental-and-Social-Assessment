const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/screening.service");

exports.getAll = asyncHandler(async (req, res) => {
  const data = await service.listScreenings();
  res.json({ success: true, data });
});

exports.getOne = asyncHandler(async (req, res) => {
  const data = await service.getScreening(req.params.id);
  res.json({ success: true, data });
});

exports.getByProject = asyncHandler(async (req, res) => {
  const data = await service.getByProject(req.params.projectId);
  res.json({ success: true, data });
});

exports.create = asyncHandler(async (req, res) => {
  const data = await service.createScreening(req.body);
  res.status(201).json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  const data = await service.updateScreening(req.params.id, req.body);
  res.json({ success: true, data });
});

exports.approve = asyncHandler(async (req, res) => {
  const data = await service.setStatus(req.params.id, "approved");
  res.json({ success: true, data });
});

exports.reject = asyncHandler(async (req, res) => {
  const data = await service.setStatus(req.params.id, "rejected");
  res.json({ success: true, data });
});
