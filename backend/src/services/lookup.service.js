const ImpactCategory = require("../models/impactCategory.model");
const ImpactQuestion = require("../models/impactQuestion.model");
const Indicator = require("../models/indicator.model");
const JobTitle = require("../models/jobTitle.model");

const getImpactCategories = async () => ImpactCategory.find().sort({ code: 1 });

const getImpactQuestions = async () =>
  ImpactQuestion.find().populate("category").sort({ createdAt: -1 });

const getIndicators = async () => Indicator.find().populate("category").sort({ createdAt: -1 });

const getJobTitles = async () => JobTitle.find().sort({ title_name: 1 });

// All four lookup collections in one response (D31).
const getAllLookups = async () => {
  const [impactCategories, impactQuestions, indicators, jobTitles] = await Promise.all([
    getImpactCategories(),
    getImpactQuestions(),
    getIndicators(),
    getJobTitles(),
  ]);
  return {
    impact_categories: impactCategories,
    impact_questions: impactQuestions,
    indicators,
    job_titles: jobTitles,
  };
};

module.exports = {
  getAllLookups,
  getImpactCategories,
  getImpactQuestions,
  getIndicators,
  getJobTitles,
};
