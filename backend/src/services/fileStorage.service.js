const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const ApiError = require("../utils/ApiError");
const { FILE_TYPES, ALLOWED_EXTENSIONS, uploadsDir } = require("../config/files");

// The one place that checks uploaded files and keeps them on disk (D47, D64): project documents
// (folder = the project id) and the reference library (folder = "library") both go through here.
// Files are parsed in memory first (middlewares/upload.js, size limit → 413), checked here by
// extension AND first bytes, then written under a server-generated name. The client's name is
// display data only and never part of a path.

const LIBRARY_FOLDER = "library";
const MAX_NAME_LENGTH = 200;

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

const typeError = (allowed) =>
  new ApiError(
    400,
    `File type not allowed. Allowed: ${allowed.map((ext) => `.${ext}`).join(", ")}`
  );

/**
 * Checks an uploaded file (multer memory storage) before anything is written.
 * @param {{originalname: string, size: number, buffer: Buffer}|undefined} file
 * @param {string[]} [allowed] extensions (default: every type of the file module)
 * @returns {{extension: string, mime: string, originalName: string, size: number}}
 */
const checkUpload = (file, allowed = ALLOWED_EXTENSIONS) => {
  if (!file) throw new ApiError(400, 'No file sent (multipart field "file")');
  const extension = extensionOf(file.originalname);
  if (!allowed.includes(extension)) throw typeError(allowed);
  const type = FILE_TYPES[extension];
  if (file.size === 0) throw new ApiError(400, "The file is empty");
  if (!matchesSignature(file.buffer, type.signature)) {
    throw new ApiError(400, `The file content does not match its .${extension} extension`);
  }
  return {
    extension,
    mime: type.mime,
    originalName: cleanOriginalName(file.originalname, extension),
    size: file.size,
  };
};

const folderPath = (folder) => path.join(uploadsDir(), String(folder));

/**
 * Writes a checked file under a new server-generated name (uuid + extension).
 * @returns {Promise<string>} the stored name
 */
const store = async (folder, buffer, extension) => {
  const storedName = `${crypto.randomUUID()}.${extension}`;
  const dir = folderPath(folder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, storedName), buffer, { flag: "wx" });
  return storedName;
};

// Absolute path of a stored file, checked to stay inside the uploads folder.
const storedPath = (folder, storedName) => {
  const root = uploadsDir();
  const full = path.resolve(folderPath(folder), storedName);
  if (!full.startsWith(root + path.sep)) throw new ApiError(404, "File not found");
  return full;
};

// The stored file, ready to send; 404 when it is gone from disk.
const readablePath = async (folder, storedName) => {
  const fullPath = storedPath(folder, storedName);
  try {
    await fs.access(fullPath);
  } catch {
    throw new ApiError(404, "The file is missing on the server");
  }
  return fullPath;
};

// Removes one stored file. Never throws: its row is gone, so the file is unreachable and a failed
// unlink only leaves disk space behind.
const remove = async (folder, storedName) => {
  let fullPath;
  try {
    fullPath = storedPath(folder, storedName);
    await fs.rm(fullPath, { force: true });
  } catch (err) {
    console.error(`Could not remove file ${fullPath ?? storedName}:`, err.message);
  }
};

// Removes a whole folder (a deleted project's files). Throws; the caller decides.
const removeFolder = (folder) => fs.rm(folderPath(folder), { recursive: true, force: true });

/**
 * Sends a stored file as a download: UTF-8 name (filename*=), stored type, never cached.
 * @param {import("express").Response} res
 * @param {Function} next
 * @param {{name: string, mime: string, fullPath: string}} file
 */
const send = (res, next, { name, mime, fullPath }) => {
  // attachment() writes both filename= (ASCII fallback) and filename*=UTF-8'' (Arabic names).
  res.attachment(name);
  res.type(mime);
  res.set("Cache-Control", "private, no-store");
  // Relative to the uploads folder: the dot rule applies to the stored part only, so an
  // UPLOADS_DIR under a dot folder (e.g. "/home/esms/.data/uploads") still serves files.
  const root = uploadsDir();
  res.sendFile(path.relative(root, fullPath), { root, dotfiles: "deny" }, (err) => {
    if (err && !res.headersSent) next(err);
  });
};

module.exports = {
  LIBRARY_FOLDER,
  checkUpload,
  cleanOriginalName,
  store,
  storedPath,
  readablePath,
  remove,
  removeFolder,
  send,
};
