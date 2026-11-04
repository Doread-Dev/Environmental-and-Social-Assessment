const ProjectFile = require("../models/projectFile.model");
const Project = require("../models/project.model");
const ApiError = require("../utils/ApiError");
const { assertProjectWritable } = require("./workflow.service");
const audit = require("./audit.service");
const storage = require("./fileStorage.service");
const { OPEN_AREAS } = require("../config/files");

// Project documents (D47, D64 d): files of one project, grouped by project-workflow place or
// "other". Type checks and disk access go through fileStorage.service; files live in the
// project's own folder.

const UPLOADED_BY = { path: "uploaded_by", select: "name role" };

// SEMP Plan §7 records are locked until v3 (D48): the area does not exist for clients yet.
const assertAreaOpen = (area) => {
  if (!OPEN_AREAS.includes(area)) throw new ApiError(404, "Not found");
};

const listFiles = async (projectId, area) => {
  assertAreaOpen(area);
  if (!(await Project.exists({ _id: projectId }))) throw new ApiError(404, "Project not found");
  return ProjectFile.find({ project: projectId, area })
    .sort({ createdAt: 1, _id: 1 })
    .populate(UPLOADED_BY);
};

const uploadFile = async (projectId, { area, category }, file, userId) => {
  assertAreaOpen(area);
  await assertProjectWritable(projectId);
  const checked = storage.checkUpload(file);
  const storedName = await storage.store(projectId, file.buffer, checked.extension);

  try {
    const created = await ProjectFile.create({
      project: projectId,
      area,
      category,
      original_name: checked.originalName,
      stored_name: storedName,
      mime_type: checked.mime,
      size: checked.size,
      uploaded_by: userId,
    });
    return created.populate(UPLOADED_BY);
  } catch (err) {
    // No row → no file: never leave an orphan on disk.
    await storage.remove(projectId, storedName);
    throw err;
  }
};

const findOpenFile = async (fileId) => {
  const file = await ProjectFile.findById(fileId);
  if (!file) throw new ApiError(404, "File not found");
  assertAreaOpen(file.area);
  return file;
};

const getDownload = async (fileId) => {
  const file = await findOpenFile(fileId);
  const fullPath = await storage.readablePath(file.project, file.stored_name);
  return { file, fullPath };
};

const deleteFile = async (fileId, user) => {
  const file = await findOpenFile(fileId);
  await assertProjectWritable(file.project);
  // Checked before the row goes, so a tampered name is refused (404) and nothing is deleted.
  storage.storedPath(file.project, file.stored_name);
  await file.populate(UPLOADED_BY);
  await ProjectFile.deleteOne({ _id: file._id });
  await audit.record(user, "file.delete", {
    project: await Project.findById(file.project).select("title").lean(),
    target: { type: "file", id: file._id, label: file.original_name },
    snapshot: {
      name: file.original_name,
      area: file.area,
      category: file.category,
      size: file.size,
      mime_type: file.mime_type,
      uploaded_by: file.uploaded_by?._id ?? null,
      uploaded_by_name: file.uploaded_by?.name ?? null,
      uploaded_at: file.createdAt,
    },
  });
  await storage.remove(file.project, file.stored_name);
};

// Re-categorise a SEMP record (§7); a project document keeps the place it was uploaded to.
const updateFileCategory = async (fileId, { category }) => {
  const existing = await ProjectFile.findById(fileId);
  if (!existing) throw new ApiError(404, "File not found");
  if (existing.area !== "semp_record") {
    throw new ApiError(400, "Only SEMP record files can change category");
  }
  const file = await findOpenFile(fileId);
  await assertProjectWritable(file.project);
  file.category = category;
  await file.save();
  return file.populate(UPLOADED_BY);
};

// Called after a project's DB rows are deleted (hard delete, purge, demo reset). Never throws:
// the project is already gone, a leftover folder only costs disk space.
const removeProjectFiles = async (projectId) => {
  try {
    await ProjectFile.deleteMany({ project: projectId });
    await storage.removeFolder(projectId);
  } catch (err) {
    console.error(`Could not remove files of project ${projectId}:`, err.message);
  }
};

module.exports = {
  listFiles,
  uploadFile,
  getDownload,
  deleteFile,
  updateFileCategory,
  removeProjectFiles,
};
