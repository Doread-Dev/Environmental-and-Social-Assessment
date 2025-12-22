const express = require("express");
const controller = require("../controllers/attachment.controller");
const validate = require("../middlewares/validate");
const { createAttachmentSchema } = require("../validators/attachment.validator");
const upload = require("../middlewares/upload");
const { auth } = require("../middlewares/auth");

const router = express.Router();

router.post("/", validate(createAttachmentSchema), controller.create);
router.get("/:id", controller.getOne);
router.post("/upload", auth, upload.single("file"), controller.upload);

module.exports = router;

