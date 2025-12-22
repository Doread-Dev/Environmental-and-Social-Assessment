const asyncHandler = require("../utils/asyncHandler");
const projectService = require("../services/project.service");

exports.getAll = asyncHandler(async (req, res) => {
  const data = await projectService.listProjects();
  res.json({ success: true, data });
});

exports.getOne = asyncHandler(async (req, res) => {
  const data = await projectService.getProject(req.params.id);
  res.json({ success: true, data });
});

exports.create = asyncHandler(async (req, res) => {
  const data = await projectService.createProject(req.body);
  res.status(201).json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  const data = await projectService.updateProject(req.params.id, req.body);
  res.json({ success: true, data });
});

exports.remove = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.params.id);
  res.status(204).send();
});
