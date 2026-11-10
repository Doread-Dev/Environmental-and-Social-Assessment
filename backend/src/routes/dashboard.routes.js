const express = require("express");
const controller = require("../controllers/dashboard.controller");
const projectAccess = require("../middlewares/projectAccess");

const router = express.Router();

// Every authenticated role, including viewer; only the projects the user may access (D66).
router.get("/", projectAccess.list(), controller.get);

module.exports = router;
