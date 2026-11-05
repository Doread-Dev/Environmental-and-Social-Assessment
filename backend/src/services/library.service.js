const LibraryDocument = require("../models/libraryDocument.model");
const ApiError = require("../utils/ApiError");
const audit = require("./audit.service");
const { atomic } = require("../utils/transaction");
const storage = require("./fileStorage.service");
const { LIBRARY_EXTENSIONS } = require("../config/files");

// The reference library (D64 b): organisation guidance, not tied to a project. PDF only; files
// live in <UPLOADS_DIR>/library through fileStorage.service. Deleting a document and replacing its
// file are critical actions (D65); creating and editing are not logged in v2.

const FOLDER = storage.LIBRARY_FOLDER;
const PEOPLE = [
  { path: "uploaded_by", select: "name role" },
  { path: "updated_by", select: "name role" },
];

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findDocument = async (id) => {
  const doc = await LibraryDocument.findById(id);
  if (!doc) throw new ApiError(404, "Library document not found");
  return doc;
};

/**
 * Every document, or those linked to one place; `search` matches title or description.
 * Ordered by `order`, then title.
 */
const listDocuments = async ({ place, search } = {}) => {
  const filter = {};
  if (place) filter.places = place;
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ title: pattern }, { description: pattern }];
  }
  return LibraryDocument.find(filter)
    .collation({ locale: "en", strength: 2 })
    .sort({ order: 1, title: 1, _id: 1 })
    .populate(PEOPLE);
};

const createDocument = async (fields, file, user) => {
  const checked = storage.checkUpload(file, LIBRARY_EXTENSIONS);
  const storedName = await storage.store(FOLDER, file.buffer, checked.extension);
  try {
    const created = await LibraryDocument.create({
      ...fields,
      original_name: checked.originalName,
      stored_name: storedName,
      mime_type: checked.mime,
      size: checked.size,
      uploaded_by: user._id,
    });
    return created.populate(PEOPLE);
  } catch (err) {
    // No row → no file: never leave an orphan on disk.
    await storage.remove(FOLDER, storedName);
    throw err;
  }
};

// Title, description, places (re-link) and order. The file stays.
const updateDocument = async (id, fields, user) => {
  const doc = await findDocument(id);
  doc.set({ ...fields, updated_by: user._id });
  await doc.save();
  return doc.populate(PEOPLE);
};

// A new PDF for the same document: title, description and links are kept. The old file is removed
// only after the new one is saved and the row points to it.
const replaceFile = async (id, file, user) => {
  const doc = await findDocument(id);
  const checked = storage.checkUpload(file, LIBRARY_EXTENSIONS);
  const old = { name: doc.original_name, size: doc.size, stored_name: doc.stored_name };
  const storedName = await storage.store(FOLDER, file.buffer, checked.extension);
  try {
    // The row and its entry in one transaction on a replica set (phase 11).
    await atomic(async () => {
      doc.set({
        original_name: checked.originalName,
        stored_name: storedName,
        mime_type: checked.mime,
        size: checked.size,
        updated_by: user._id,
      });
      await doc.save();
      await audit.record(user, "library.replace_file", {
        target: { type: "library_document", id: doc._id, label: doc.title },
        snapshot: { title: doc.title, old_name: old.name, old_size: old.size },
        details: { new_name: doc.original_name, new_size: doc.size },
      });
    });
  } catch (err) {
    await storage.remove(FOLDER, storedName);
    throw err;
  }
  await storage.remove(FOLDER, old.stored_name);
  return doc.populate(PEOPLE);
};

const deleteDocument = async (id, user) => {
  const doc = await findDocument(id);
  // Checked before the row goes, so a tampered name is refused (404) and nothing is deleted.
  storage.storedPath(FOLDER, doc.stored_name);
  await doc.populate(PEOPLE);
  // The row and its entry in one transaction on a replica set (phase 11); the file on disk after.
  await atomic(async () => {
    await LibraryDocument.deleteOne({ _id: doc._id });
    await audit.record(user, "library.delete", {
      target: { type: "library_document", id: doc._id, label: doc.title },
      snapshot: {
        title: doc.title,
        description: doc.description,
        places: doc.places,
        order: doc.order,
        name: doc.original_name,
        size: doc.size,
        mime_type: doc.mime_type,
        uploaded_by: doc.uploaded_by?._id ?? null,
        uploaded_by_name: doc.uploaded_by?.name ?? null,
        uploaded_at: doc.createdAt,
      },
    });
  });
  await storage.remove(FOLDER, doc.stored_name);
};

const getFile = async (id) => {
  const doc = await findDocument(id);
  const fullPath = await storage.readablePath(FOLDER, doc.stored_name);
  return { doc, fullPath };
};

// Dev scripts only (the demo seed replaces its own sample): row and file, no log entry, as the
// demo project cleanup does.
const removeDocumentsByTitle = async (title) => {
  const docs = await LibraryDocument.find({ title });
  for (const doc of docs) {
    await LibraryDocument.deleteOne({ _id: doc._id });
    await storage.remove(FOLDER, doc.stored_name);
  }
  return docs.length;
};

module.exports = {
  listDocuments,
  createDocument,
  updateDocument,
  replaceFile,
  deleteDocument,
  getFile,
  removeDocumentsByTitle,
};
