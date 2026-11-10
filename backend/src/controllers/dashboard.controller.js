const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/dashboard.service");

exports.get = asyncHandler(async (req, res) => {
  const data = await service.getDashboard(req.user, req.projectFilter);
  res.json({ success: true, data });
});
