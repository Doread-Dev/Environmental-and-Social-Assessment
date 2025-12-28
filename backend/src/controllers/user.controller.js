const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/user.service");

exports.getAll = asyncHandler(async (req, res) => {
  const data = await service.listUsers();
  res.json({ success: true, data });
});

exports.getOne = asyncHandler(async (req, res) => {
  const data = await service.getUser(req.params.id);
  res.json({ success: true, data });
});

