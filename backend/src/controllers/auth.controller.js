const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/auth.service");

exports.login = asyncHandler(async (req, res) => {
  const { user, token } = await service.login(req.body.email, req.body.password);
  res.json({ success: true, data: { user, token } });
});

exports.me = asyncHandler(async (req, res) => {
  const data = await service.getMe(req.user._id);
  res.json({ success: true, data });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { current_password: current, new_password: next } = req.body;
  const data = await service.changePassword(req.user, current, next);
  res.json({ success: true, data });
});
