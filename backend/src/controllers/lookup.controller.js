const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/lookup.service");

exports.getAll = asyncHandler(async (req, res) => {
  const data = await service.getAllLookups();
  res.json({ success: true, data });
});
