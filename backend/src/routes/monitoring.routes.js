const express = require("express");
const controller = require("../controllers/monitoring.controller");

const router = express.Router();

// Records are saved with PUT /projects/:id/monitoring (D32).
router.get("/project/:projectId", controller.getByProject);
router.get("/:id", controller.getOne);

module.exports = router;
