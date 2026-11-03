const express = require("express");
const controller = require("../controllers/auditLog.controller");
const { requireRole } = require("../middlewares/auth");
const { ADMIN_ROLES } = require("../config/roles");

const router = express.Router();

router.get("/", requireRole(...ADMIN_ROLES), controller.getAll);

module.exports = router;
