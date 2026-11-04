const Joi = require("joi");
const { AUDIT_ACTIONS, AUDIT_ACTION_PREFIXES } = require("../models/auditLog.model");

// GET /audit-logs. `action`: an action ("project.purge") or a prefix ("user.").
const listAuditLogsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  action: Joi.string().valid(...AUDIT_ACTIONS, ...AUDIT_ACTION_PREFIXES),
  from: Joi.date().iso(),
  to: Joi.when("from", {
    is: Joi.exist(),
    then: Joi.date().iso().min(Joi.ref("from")),
    otherwise: Joi.date().iso(),
  }),
});

module.exports = { listAuditLogsQuerySchema };
