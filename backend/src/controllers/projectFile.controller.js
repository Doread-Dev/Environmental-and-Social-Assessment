const asyncHandler = require("../utils/asyncHandler");
const fileService = require("../services/projectFile.service");
const storage = require("../services/fileStorage.service");

exports.list = asyncHandler(async (req, res) => {
  const data = await fileService.listFiles(req.params.id, req.query.area);
  res.json({ success: true, data });
});

exports.upload = asyncHandler(async (req, res) => {
  const data = await fileService.uploadFile(req.params.id, req.body, req.file, req.user._id);
  res.status(201).json({ success: true, data });
});

exports.download = asyncHandler(async (req, res, next) => {
  const { file, fullPath } = await fileService.getDownload(req.params.fileId);
  storage.send(res, next, { mime: file.mime_type, fullPath });
});

exports.remove = asyncHandler(async (req, res) => {
  await fileService.deleteFile(req.params.fileId, req.user);
  res.status(204).send();
});

exports.update = asyncHandler(async (req, res) => {
  const data = await fileService.updateFileCategory(req.params.fileId, req.body);
  res.json({ success: true, data });
});
