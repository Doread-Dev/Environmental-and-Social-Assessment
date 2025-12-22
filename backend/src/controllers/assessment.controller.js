const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/assessment.service");

exports.getAll = asyncHandler(async (req, res) => {
  const data = await service.listAssessments();
  res.json({ success: true, data });
});

exports.getOne = asyncHandler(async (req, res) => {
  const data = await service.getAssessment(req.params.id);
  res.json({ success: true, data });
});

exports.getByProject = asyncHandler(async (req, res) => {
  const data = await service.getByProject(req.params.projectId);
  res.json({ success: true, data });
});

exports.create = asyncHandler(async (req, res) => {
  const data = await service.createAssessment(req.body);
  res.status(201).json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  const data = await service.updateAssessment(req.params.id, req.body);
  res.json({ success: true, data });
});

exports.addMethod = asyncHandler(async (req, res) => {
  const data = await service.addMethod(req.params.id, req.body);
  res.status(201).json({ success: true, data });
});

exports.addConsultation = asyncHandler(async (req, res) => {
  const data = await service.addConsultation(req.params.id, req.body);
  res.status(201).json({ success: true, data });
});

exports.addScores = asyncHandler(async (req, res) => {
  const data = await service.addScores(req.params.id, req.body);
  res.status(201).json({ success: true, data });
});

exports.calculate = asyncHandler(async (req, res) => {
  const data = await service.calculateImpact(req.params.id);
  res.json({ success: true, data });
});

