const asyncHandler = require("../utils/asyncHandler");
const fileService = require("../services/projectFile.service");

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
  // attachment() writes both filename= (ASCII fallback) and filename*=UTF-8'' (Arabic names).
  res.attachment(file.original_name);
  res.type(file.mime_type);
  res.set("Cache-Control", "private, no-store");
  res.sendFile(fullPath, { dotfiles: "deny" }, (err) => {
    if (err && !res.headersSent) next(err);
  });
});

exports.remove = asyncHandler(async (req, res) => {
  await fileService.deleteFile(req.params.fileId, req.user);
  res.status(204).send();
});

exports.update = asyncHandler(async (req, res) => {
  const data = await fileService.updateFileCategory(req.params.fileId, req.body);
  res.json({ success: true, data });
});
