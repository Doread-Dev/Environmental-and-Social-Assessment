const express = require("express");
const controller = require("../controllers/lookup.controller");

const router = express.Router();

// All four lookup collections in one response (D31).
router.get("/", controller.getAll);

module.exports = router;
