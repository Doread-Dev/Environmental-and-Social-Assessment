const express = require("express");
const controller = require("../controllers/mitigationPlan.controller");
const projectAccess = require("../middlewares/projectAccess");

const router = express.Router();

// The table is saved as a whole with PUT /projects/:id/mitigation (D32).
router.get("/project/:projectId", projectAccess.fromParam("projectId"), controller.listByProject);

module.exports = router;
