const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/attachment.service");

exports.create = asyncHandler(async (req, res) => {
  const data = await service.createAttachment(req.body);
  res.status(201).json({ success: true, data });
});

exports.getOne = asyncHandler(async (req, res) => {
  const data = await service.getAttachment(req.params.id);
  res.json({ success: true, data });
});

exports.upload = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No file uploaded" });
  }
  const { entity_type, entity_id } = req.body;
  const payload = {
    entity_type,
    entity_id,
    file_name: req.file.originalname,
    file_path: req.file.path,
    file_type: req.file.mimetype,
    file_size: req.file.size,
    uploaded_by: req.user?._id,
  };
  const data = await service.createAttachment(payload);
  res.status(201).json({ success: true, data });
});

