const asyncHandler = require("../utils/asyncHandler");
const libraryService = require("../services/library.service");
const storage = require("../services/fileStorage.service");

exports.list = asyncHandler(async (req, res) => {
  const data = await libraryService.listDocuments(req.query);
  res.json({ success: true, data });
});

exports.create = asyncHandler(async (req, res) => {
  const data = await libraryService.createDocument(req.body, req.file, req.user);
  res.status(201).json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  const data = await libraryService.updateDocument(req.params.id, req.body, req.user);
  res.json({ success: true, data });
});

exports.replaceFile = asyncHandler(async (req, res) => {
  const data = await libraryService.replaceFile(req.params.id, req.file, req.user);
  res.json({ success: true, data });
});

exports.remove = asyncHandler(async (req, res) => {
  await libraryService.deleteDocument(req.params.id, req.user);
  res.status(204).send();
});

exports.file = asyncHandler(async (req, res, next) => {
  const { doc, fullPath } = await libraryService.getFile(req.params.id);
  storage.send(res, next, { name: doc.original_name, mime: doc.mime_type, fullPath });
});
