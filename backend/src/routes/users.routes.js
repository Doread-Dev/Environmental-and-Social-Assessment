const express = require("express");
const controller = require("../controllers/user.controller");

const router = express.Router();

// Every authenticated role, including viewer, can list users.
router.get("/", controller.getAll);

module.exports = router;
