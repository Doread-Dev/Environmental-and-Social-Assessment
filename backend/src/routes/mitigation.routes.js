const express = require("express");
const controller = require("../controllers/mitigationPlan.controller");

const router = express.Router();

// The table is saved as a whole with PUT /projects/:id/mitigation (D32).
router.get("/project/:projectId", controller.listByProject);

module.exports = router;
