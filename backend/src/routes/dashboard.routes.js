const express = require("express");
const controller = require("../controllers/dashboard.controller");

const router = express.Router();

// Every authenticated role, including viewer.
router.get("/", controller.get);

module.exports = router;
