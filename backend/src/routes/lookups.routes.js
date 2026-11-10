const express = require("express");
const controller = require("../controllers/lookup.controller");

const router = express.Router();

// All four lookup collections and the places registry in one response (D31, D64 a).
router.get("/", controller.getAll);

module.exports = router;
