const asyncHandler = require("../utils/asyncHandler");
const auditLogService = require("../services/auditLog.service");

exports.getAll = asyncHandler(async (req, res) => {
  const data = await auditLogService.listAuditLogs();
  res.json({ success: true, data });
});
