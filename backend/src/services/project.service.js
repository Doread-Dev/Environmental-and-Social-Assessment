const Project = require("../models/project.model");
const ApiError = require("../utils/ApiError");

const listProjects = async () => {
  return Project.find().sort({ createdAt: -1 });
};

const getProject = async (id) => {
  const project = await Project.findById(id);
  if (!project) throw new ApiError(404, "Project not found");
  return project;
};

const createProject = async (payload) => {
  return Project.create(payload);
};

const updateProject = async (id, payload) => {
  const updated = await Project.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new ApiError(404, "Project not found");
  return updated;
};

const deleteProject = async (id) => {
  const project = await Project.findById(id);
  if (!project) throw new ApiError(404, "Project not found");
  await project.deleteOne();
  return true;
};

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
};

