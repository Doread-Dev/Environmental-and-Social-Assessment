const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/auth.service");

exports.register = asyncHandler(async (req, res) => {
  const { user, token } = await service.register(req.body);
  res.status(201).json({ success: true, data: { user, token } });
});

exports.login = asyncHandler(async (req, res) => {
  const { user, token } = await service.login(req.body.email, req.body.password);
  res.json({ success: true, data: { user, token } });
});

