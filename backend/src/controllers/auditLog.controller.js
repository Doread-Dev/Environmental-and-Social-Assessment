const asyncHandler = require("../utils/asyncHandler");
const auditService = require("../services/audit.service");

exports.getAll = asyncHandler(async (req, res) => {
  const { items, pagination } = await auditService.listEntries(req.query);
  res.json({ success: true, data: items, pagination });
});
