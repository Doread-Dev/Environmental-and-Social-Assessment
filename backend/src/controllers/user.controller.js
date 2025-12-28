const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/user.service");

exports.getAll = asyncHandler(async (req, res) => {
  const data = await service.listUsers();
  res.json({ success: true, data });
});

