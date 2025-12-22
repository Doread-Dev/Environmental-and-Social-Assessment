const express = require("express");
const controller = require("../controllers/managementActivity.controller");
const validate = require("../middlewares/validate");
const {
  createManagementActivitySchema,
  updateManagementActivitySchema,
} = require("../validators/managementActivity.validator");

const router = express.Router();

router.get("/project/:projectId", controller.listByProject);
router.post("/", validate(createManagementActivitySchema), controller.create);
router.put("/:id", validate(updateManagementActivitySchema), controller.update);
router.delete("/:id", controller.remove);

module.exports = router;

