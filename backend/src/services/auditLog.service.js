const AuditLog = require("../models/auditLog.model");

const listAuditLogs = async () => {
  return AuditLog.find().sort({ createdAt: -1 }).populate({ path: "by", select: "name role" });
};

module.exports = { listAuditLogs };
