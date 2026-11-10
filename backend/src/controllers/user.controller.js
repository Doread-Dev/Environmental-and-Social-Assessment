const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/user.service");

exports.getAll = asyncHandler(async (req, res) => {
  const data = await service.listUsers(req.user);
  res.json({ success: true, data });
});

exports.create = asyncHandler(async (req, res) => {
  const data = await service.createUser(req.body, req.user);
  res.status(201).json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  const data = await service.updateUser(req.params.id, req.body, req.user);
  res.json({ success: true, data });
});

exports.deactivate = asyncHandler(async (req, res) => {
  const data = await service.setActive(req.params.id, false, req.user);
  res.json({ success: true, data });
});

exports.reactivate = asyncHandler(async (req, res) => {
  const data = await service.setActive(req.params.id, true, req.user);
  res.json({ success: true, data });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const data = await service.resetPassword(req.params.id, req.user);
  res.json({ success: true, data });
});
