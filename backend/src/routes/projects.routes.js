const express = require("express");
const controller = require("../controllers/project.controller");
const validate = require("../middlewares/validate");
const { createProjectSchema, updateProjectSchema } = require("../validators/project.validator");
const { requireRole } = require("../middlewares/auth");
const { EDITOR_ROLES, SPECIALIST_ROLES } = require("../config/roles");

const router = express.Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.post("/", requireRole(...EDITOR_ROLES), validate(createProjectSchema), controller.create);
router.put("/:id", requireRole(...EDITOR_ROLES), validate(updateProjectSchema), controller.update);
router.delete("/:id", requireRole(...SPECIALIST_ROLES), controller.remove);

module.exports = router;
