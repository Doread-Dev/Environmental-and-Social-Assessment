const asyncHandler = require("../utils/asyncHandler");
const projectService = require("../services/project.service");

exports.getAll = asyncHandler(async (req, res) => {
  const { items, pagination } = await projectService.listProjects(req.query, req.user.role);
  res.json({ success: true, data: items, pagination });
});

exports.getOne = asyncHandler(async (req, res) => {
  const data = await projectService.getProject(req.params.id);
  res.json({ success: true, data });
});

exports.getWorkspace = asyncHandler(async (req, res) => {
  const data = await projectService.getWorkspace(req.params.id, req.user.role);
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

exports.purge = asyncHandler(async (req, res) => {
  await projectService.purgeProject(req.params.id, req.user._id);
  res.status(204).send();
});

exports.archive = asyncHandler(async (req, res) => {
  const data = await projectService.archiveProject(req.params.id, req.user._id);
  res.json({ success: true, data });
});

exports.restore = asyncHandler(async (req, res) => {
  const data = await projectService.restoreProject(req.params.id);
  res.json({ success: true, data });
});
