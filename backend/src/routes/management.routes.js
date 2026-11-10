const express = require("express");
const controller = require("../controllers/managementActivity.controller");
const projectAccess = require("../middlewares/projectAccess");

const router = express.Router();

// The table is saved as a whole with PUT /projects/:id/management (D32).
router.get("/project/:projectId", projectAccess.fromParam("projectId"), controller.listByProject);

module.exports = router;
