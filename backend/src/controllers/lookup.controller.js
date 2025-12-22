const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/lookup.service");

exports.getImpactCategories = asyncHandler(async (req, res) => {
  const data = await service.getImpactCategories();
  res.json({ success: true, data });
});

exports.getImpactQuestions = asyncHandler(async (req, res) => {
  const data = await service.getImpactQuestions();
  res.json({ success: true, data });
});

exports.getIndicators = asyncHandler(async (req, res) => {
  const data = await service.getIndicators();
  res.json({ success: true, data });
});

exports.getJobTitles = asyncHandler(async (req, res) => {
  const data = await service.getJobTitles();
  res.json({ success: true, data });
});

