const express = require("express");
const controller = require("../controllers/screening.controller");
const validate = require("../middlewares/validate");
const { createScreeningSchema, updateScreeningSchema } = require("../validators/screening.validator");

const router = express.Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.get("/project/:projectId", controller.getByProject);
router.post("/", validate(createScreeningSchema), controller.create);
router.put("/:id", validate(updateScreeningSchema), controller.update);
router.patch("/:id/approve", controller.approve);
router.patch("/:id/reject", controller.reject);

module.exports = router;

