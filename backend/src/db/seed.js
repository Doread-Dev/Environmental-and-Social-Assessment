require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/database");

const ImpactCategory = require("../models/impactCategory.model");
const ImpactQuestion = require("../models/impactQuestion.model");
const Indicator = require("../models/indicator.model");
const JobTitle = require("../models/jobTitle.model");

async function seedLookups() {
  await connectDB();

  const impactCategories = [
    { code: "A", name: "Air Quality", name_ar: "جودة الهواء" },
    { code: "B", name: "Water Quality", name_ar: "جودة المياه" },
    { code: "C", name: "Noise", name_ar: "الضجيج" },
    { code: "D", name: "Solid Waste", name_ar: "النفايات الصلبة" },
    { code: "E", name: "Radiation", name_ar: "الإشعاع" },
    {
      code: "F",
      name: "Toxic & Dangerous Materials",
      name_ar: "المواد الخطرة",
    },
    {
      code: "J",
      name: "Plants, Forests & Wildlife",
      name_ar: "النباتات والحياة البرية",
    },
    {
      code: "H",
      name: "Land Use & Social Impacts",
      name_ar: "استخدام الأرض والمجتمع",
    },
  ];

  const jobTitles = [
    "Environmental specialist",
    "Program Manager",
    "Project Manager",
    "Environmental focal point",
    "Viewer"
  ];

  // Minimal starter set of questions and indicators; can be extended later
  const questions = [
    { code: "A", text: "Will the project generate dust or smoke?" },
    { code: "A", text: "Will there be vehicle emissions?" },
    { code: "B", text: "Will the project discharge wastewater?" },
    { code: "C", text: "Will the project create sustained noise?" },
  ];

  const indicators = [
    {
      code: "A",
      name: "Visible Air Pollution",
      definition: "Presence of visible dust/smoke around the site",
      measurement: "Observation",
    },
    {
      code: "A",
      name: "Community Complaints about Air",
      definition: "Logged air-quality complaints from community",
      measurement: "Review complaints",
    },
    {
      code: "B",
      name: "Water Quality Complaints",
      definition: "Number of complaints related to water contamination",
      measurement: "Review complaints",
    },
  ];

  try {
    console.log("Seeding lookup tables...");

    await ImpactCategory.deleteMany({});
    const createdCategories = await ImpactCategory.insertMany(impactCategories);
    const catByCode = createdCategories.reduce((acc, c) => {
      acc[c.code] = c._id;
      return acc;
    }, {});

    await JobTitle.deleteMany({});
    await JobTitle.insertMany(jobTitles.map((title_name) => ({ title_name })));

    await ImpactQuestion.deleteMany({});
    await ImpactQuestion.insertMany(
      questions.map((q) => ({
        category: catByCode[q.code],
        question_text: q.text,
      }))
    );

    await Indicator.deleteMany({});
    await Indicator.insertMany(
      indicators.map((i) => ({
        category: catByCode[i.code],
        name: i.name,
        definition: i.definition,
        measurement: i.measurement,
      }))
    );

    console.log("Lookup data seeded successfully.");
  } catch (err) {
    console.error("Seeding error:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seedLookups();
