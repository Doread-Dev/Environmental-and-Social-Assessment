const express = require("express");
const controller = require("../controllers/auditLog.controller");
const validate = require("../middlewares/validate");
const { requirePermission } = require("../middlewares/auth");
const { listAuditLogsQuerySchema } = require("../validators/auditLog.validator");

// Read only (D65): entries are written by services/audit.service.js, never through the API.
const router = express.Router();

router.get(
  "/",
  requirePermission("read_audit_log"),
  validate(listAuditLogsQuerySchema, "query"),
  controller.getAll
);

module.exports = router;
