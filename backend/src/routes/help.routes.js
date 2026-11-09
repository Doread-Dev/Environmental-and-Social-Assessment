const express = require("express");
const controller = require("../controllers/help.controller");
const validate = require("../middlewares/validate");
const { helpQuerySchema } = require("../validators/help.validator");

// The in-app user guide (phase 14, D78): every signed-in user, no permission of its own. The
// service gives each user only the sections their permissions allow; not tied to a project.
const router = express.Router();

router.get("/", validate(helpQuerySchema, "query"), controller.get);

module.exports = router;
