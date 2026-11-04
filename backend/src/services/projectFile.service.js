const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const ProjectFile = require("../models/projectFile.model");
const Project = require("../models/project.model");
const ApiError = require("../utils/ApiError");
const { assertProjectWritable } = require("./workflow.service");
const audit = require("./audit.service");
const { OPEN_AREAS, FILE_TYPES, ALLOWED_EXTENSIONS, uploadsDir } = require("../config/files");

const UPLOADED_BY = { path: "uploaded_by", select: "name role" };
const MAX_NAME_LENGTH = 200;

// SEMP Plan §7 records are locked until v3 (D48): the area does not exist for clients yet.
const assertAreaOpen = (area) => {
  if (!OPEN_AREAS.includes(area)) throw new ApiError(404, "Not found");
};

// The client's name is display data only: last path segment, no control characters, bounded.
const cleanOriginalName = (rawName, extension) => {
  const lastSegment = String(rawName).split(/[\\/]/).pop();
  // eslint-disable-next-line no-control-regex
  let name = lastSegment.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (name.length > MAX_NAME_LENGTH) {
    const suffix = `.${extension}`;
    name = name.slice(0, MAX_NAME_LENGTH - suffix.length) + suffix;
  }
  return name && name !== `.${extension}` ? name : `file.${extension}`;
};

const extensionOf = (name) => {
  const match = /\.([A-Za-z0-9]+)$/.exec(String(name).trim());
  return match ? match[1].toLowerCase() : "";
};

// PDFs may have a few bytes of junk before the header; Office files must start with theirs.
const matchesSignature = (buffer, signature) => {
  const expected = Buffer.from(signature, "latin1");
  if (signature.startsWith("%PDF")) return buffer.subarray(0, 1024).includes(expected);
  return buffer.subarray(0, expected.length).equals(expected);
};

const projectDir = (projectId) => path.join(uploadsDir(), String(projectId));

const typeError = () =>
  new ApiError(
    400,
    `File type not allowed. Allowed: ${ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(", ")}`
  );

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
  if (!file) throw new ApiError(400, 'No file sent (multipart field "file")');

  const extension = extensionOf(file.originalname);
  const type = FILE_TYPES[extension];
  if (!type) throw typeError();
  // The size limit is enforced while parsing (middlewares/upload.js → 413).
  if (file.size === 0) throw new ApiError(400, "The file is empty");
  if (!matchesSignature(file.buffer, type.signature)) {
    throw new ApiError(400, `The file content does not match its .${extension} extension`);
  }

  const storedName = `${crypto.randomUUID()}.${extension}`;
  const dir = projectDir(projectId);
  const target = path.join(dir, storedName);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(target, file.buffer, { flag: "wx" });

  try {
    const created = await ProjectFile.create({
      project: projectId,
      area,
      category,
      original_name: cleanOriginalName(file.originalname, extension),
      stored_name: storedName,
      mime_type: type.mime,
      size: file.size,
      uploaded_by: userId,
    });
    return created.populate(UPLOADED_BY);
  } catch (err) {
    // No row → no file: never leave an orphan on disk.
    await fs.rm(target, { force: true }).catch(() => {});
    throw err;
  }
};

const findOpenFile = async (fileId) => {
  const file = await ProjectFile.findById(fileId);
  if (!file) throw new ApiError(404, "File not found");
  assertAreaOpen(file.area);
  return file;
};

// Absolute path of a stored file, checked to stay inside the uploads folder.
const resolveStoredPath = (file) => {
  const root = uploadsDir();
  const full = path.resolve(projectDir(file.project), file.stored_name);
  if (!full.startsWith(root + path.sep)) throw new ApiError(404, "File not found");
  return full;
};

const getDownload = async (fileId) => {
  const file = await findOpenFile(fileId);
  const fullPath = resolveStoredPath(file);
  try {
    await fs.access(fullPath);
  } catch {
    throw new ApiError(404, "The file is missing on the server");
  }
  return { file, fullPath };
};

const deleteFile = async (fileId, user) => {
  const file = await findOpenFile(fileId);
  await assertProjectWritable(file.project);
  const fullPath = resolveStoredPath(file);
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
  // The row is gone, so the file is unreachable; a failed unlink only leaves disk space behind.
  await fs.rm(fullPath, { force: true }).catch((err) => {
    console.error(`Could not remove file ${fullPath}:`, err.message);
  });
};

// Re-categorise a SEMP record (§7); annex files keep the annex they were uploaded to.
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
    await fs.rm(projectDir(projectId), { recursive: true, force: true });
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
  cleanOriginalName,
};
