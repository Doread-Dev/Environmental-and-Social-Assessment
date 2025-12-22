const express = require("express");
const controller = require("../controllers/project.controller");
const validate = require("../middlewares/validate");
const { createProjectSchema, updateProjectSchema } = require("../validators/project.validator");

const router = express.Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.post("/", validate(createProjectSchema), controller.create);
router.put("/:id", validate(updateProjectSchema), controller.update);
router.delete("/:id", controller.remove);

module.exports = router;

