const express = require("express");
const controller = require("../controllers/lookup.controller");

const router = express.Router();

router.get("/impact-categories", controller.getImpactCategories);
router.get("/impact-questions", controller.getImpactQuestions);
router.get("/indicators", controller.getIndicators);
router.get("/job-titles", controller.getJobTitles);

module.exports = router;

