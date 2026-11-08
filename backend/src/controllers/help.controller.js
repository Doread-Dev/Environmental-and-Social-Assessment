const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/help.service");

exports.get = asyncHandler(async (req, res) => {
  res.json({ success: true, data: service.helpFor(req.user, req.query.lang) });
});
