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
    { code: "C", name: "The quality and effect of noise", name_ar: "الضجيج" },
    { code: "D", name: "Solid waste effect ", name_ar: "النفايات الصلبة" },
    { code: "E", name: "Radiation effect", name_ar: "الإشعاع" },
    {
      code: "F",
      name: "Toxic and Dangerous Materials effect",
      name_ar: "المواد الخطرة",
    },
    {
      code: "J",
      name: "The Environmental impacts on natural plants, forests, and wildlife",
      name_ar: "النباتات والحياة البرية",
    },
    {
      code: "H",
      name: "Environmental impacts of land use and management",
      name_ar: "استخدام الأرض والمجتمع",
    },
  ];

  const jobTitles = [
    "Environmental Specialist",
    "Program Manager",
    "Project Manager",
    "Environmental focal point",
    "Viewer"
  ];

  // Minimal starter set of questions and indicators; can be extended later
  const questions = [
    {
      code: "A",
      text: "Will the project generate air pollution (e.g., fuel use, industry, construction dust)?",
    },
    {
      code: "A",
      text: "Will the project increase vehicle or machinery use (e.g., transport, heavy equipment, generators)?",
    },
    {
      code: "A",
      text: "Will the project release chemicals, gases, or fine particles into the air?",
    },
    {
      code: "A",
      text: "Will air pollution from the project affect nearby homes, schools, or nature areas (within 1 km)?",
    },
    {
      code: "A",
      text: "Is the local climate or geography likely to trap pollution instead of dispersing it?",
    },
    {
      code: "B",
      text: "Will the project pollute nearby water sources (e.g., rivers, lakes, groundwater)?",
    },
    {
      code: "B",
      text: "Will the project affect surface or groundwater quality or availability?",
    },
    {
      code: "B",
      text: "Will the project impact water used for drinking, irrigation, or ecosystems?",
    },
    {
      code: "B",
      text: "Will the project change water temperature (e.g., due to industrial discharge or deforestation)?",
    },
    {
      code: "B",
      text: "Will the project release toxic substances (e.g., chemicals, heavy metals) into water?",
    },
    {
      code: "C",
      text: "Will the project create noise levels that exceed recognized safety limits for human exposure?",
    },
    {
      code: "C",
      text: "Will the project introduce new or significantly louder noise compared to the current environment?",
    },
    {
      code: "C",
      text: "How far will the noise from the project travel and impact surrounding areas?",
    },
    {
      code: "C",
      text: "Will the noise affect sensitive places like schools, hospitals, or residential areas?",
    },
    {
      code: "C",
      text: "Will the noise be more disruptive due to its timing (e.g., nighttime) or duration (e.g., long-term exposure)?",
    },
    {
      code: "D",
      text: "Will the project negatively affect the existing solid waste management system?",
    },
    { code: "D", text: "How much solid waste will the project generate?" },
    {
      code: "D",
      text: "Can the waste from the project be recycled or reused?",
    },
    {
      code: "D",
      text: "Will the waste cause harm to the environment (e.g., land, water, wildlife)?",
    },
    {
      code: "D",
      text: "Does the waste pose safety risks due to how it is stored, handled, or disposed of?",
    },
    {
      code: "E",
      text: "Will the project cause radiation exposure above safe limits for people and the environment?",
    },
    {
      code: "E",
      text: "What is the impact of the type of radiation emitted by the project (e.g., alpha, beta, gamma, neutron)?",
    },
    {
      code: "E",
      text: "Will sensitive groups (e.g., children, pregnant women, endangered species) be affected by radiation from the project?",
    },
    {
      code: "E",
      text: "What is the risk of radioactive contamination of soil, water, or air due to the project?",
    },
    {
      code: "E",
      text: "How significant is the impact of radiation exposure based on how often and how long it occurs?",
    },
    {
      code: "F",
      text: "Will the project release toxic or hazardous materials that could harm the ecosystem?",
    },
    {
      code: "F",
      text: "What is the risk from storing, handling, or transporting toxic or dangerous materials?",
    },
    {
      code: "F",
      text: "Will the project pose health risks to people due to exposure to toxic materials?",
    },
    {
      code: "F",
      text: "What is the risk of toxic materials contaminating water, soil, or air?",
    },
    {
      code: "F",
      text: "How risky is the disposal of waste containing toxic or dangerous materials?",
    },
    {
      code: "J",
      text: "Will the project lead to loss of natural plants, wildlife, or biodiversity?",
    },
    {
      code: "J",
      text: "Will the project affect animal behavior, migration, or increase the risk of species loss?",
    },
    {
      code: "J",
      text: "Will the project harm tree growth or reduce vegetation cover?",
    },
    {
      code: "J",
      text: "Will the project negatively impact aquatic wildlife and habitats (e.g., lakes, rivers, seas)?",
    },
    {
      code: "J",
      text: "Will the project increase the risk of forest fires or cause habitat fragmentation?",
    },
    {
      code: "J",
      text: "Will the project introduce or spread invasive species?",
    },
    { code: "J", text: "Will the project affect soil health and fertility?" },
    {
      code: "J",
      text: "Will the project impact water resources needed for natural ecosystems?",
    },
    {
      code: "J",
      text: "Will the project disrupt ecological connectivity and wildlife corridors?",
    },
    {
      code: "J",
      text: "Will the project harm pollinators (e.g., bees, butterflies) or endangered species and their habitats?",
    },
    {
      code: "H",
      text: "Will the project negatively impact national parks, scenic areas, recreation, or tourism?",
    },
    {
      code: "H",
      text: "Will the project affect archaeological sites, cultural heritage, or traditional practices?",
    },
    {
      code: "H",
      text: "Will the project change the aesthetic appearance of the area (e.g., landscapes, views)?",
    },
    {
      code: "H",
      text: "Will the project negatively affect land use diversity or conflict with existing land use plans?",
    },
    {
      code: "H",
      text: "Will the project cause significant changes in population density or settlement patterns?",
    },
    {
      code: "H",
      text: "Will the project negatively impact local economic growth, economic diversity, or resilience?",
    },
    {
      code: "H",
      text: "Will the project alter the region's social structure or way of life?",
    },
    {
      code: "H",
      text: "Will the project reduce available agricultural land or lower productivity?",
    },
    {
      code: "H",
      text: "Will the project negatively affect residential areas, community cohesion, or social equity?",
    },
    {
      code: "H",
      text: "Will the project put pressure on existing infrastructure (e.g., roads, utilities, schools, healthcare)?",
    },
  ];

  const indicators = [
    {
      code: "A",
      name: "Presence of Visible Air Pollution from Project Activities",
      definition:
        "Assesses if dust, smoke, or emissions are noticeable in the project area.",
      measurement:
        "Observation of visible pollution (e.g., smoke from fuel use, industrial processes, construction dust).",
    },
    {
      code: "A",
      name: "Complaints from the Community About Air Quality Issues",
      definition:
        "Tracks whether residents, workers, or local authorities report air pollution problems",
      measurement:
        "Count and nature of complaints (from community meetings, surveys, or records).",
    },
    {
      code: "A",
      name: "Change in Soil, Vegetation Condition in the Project Area",
      definition:
        "Assesses whether the soil or the plants show signs of damage (e.g., leaf discoloration, stunted growth) due to air pollution.",
      measurement:
        "Visual assessment of the soil degradation or plant health near the project site.",
    },
    {
      code: "B",
      name: "Presence of Visible Water Contamination",
      definition:
        "Assesses whether water in local rivers, lakes, or streams near the project appears polluted (e.g., oil, foam, discoloration).",
      measurement:
        "Visual inspection of water bodies for signs of contamination.",
    },
    {
      code: "B",
      name: "Community Reports of Water Issues (Quality or Availability)",
      definition:
        "Monitors whether locals experience water-related problems linked to the project (e.g., bad smell, reduced supply, health concerns).",
      measurement:
        "Number and type of complaints from community surveys or meetings.",
    },
    {
      code: "B",
      name: "Changes in Animals, Vegetation, or Soil Health Near Water Sources",
      definition:
        "Observes whether Animals and plants near water bodies are affected (e.g., Illnesses, deaths, unusual dryness, yellowing, erosion).",
      measurement:
        "Visual assessment of Animals, Soil, plant condition near rivers, lakes, or wetlands.",
    },
    {
      code: "C",
      name: "Number of Community Complaints About Noise",
      definition:
        "Tracks reports from residents, workers, or local institutions (e.g., schools, hospitals) about noise disturbances caused by the project.",
      measurement:
        "Review community feedback, complaints, or surveys regarding noise issues.",
    },
    {
      code: "C",
      name: "Observation of Noise Disruption in Sensitive Areas (e.g., Schools, Hospitals, Homes)",
      definition:
        "Assesses whether noise from the project is noticeable or disruptive in nearby sensitive locations.",
      measurement:
        "Visual and auditory assessment at different times of the day near schools, hospitals, and residential areas.",
    },
    {
      code: "C",
      name: "Change in Noise Levels at Different Times of the Day",
      definition:
        "Evaluates whether noise from the project increases significantly during specific times (e.g., early morning, late night).",
      measurement:
        "Field observation of noise patterns at various times of the day and week.",
    },
    {
      code: "D",
      name: "Number of Community Complaints About Solid Waste Issues",
      definition:
        "Tracks reports from residents, workers, or local authorities about problems related to waste disposal, accumulation, or pollution caused by the project, Including visual pollution caused by waste.",
      measurement:
        "Review community feedback, complaints, or surveys regarding solid waste issues.",
    },
    {
      code: "D",
      name: "Visibility of Solid Waste Accumulation Near the Project Site",
      definition:
        "Assesses whether solid waste from the project is noticeable and whether proper disposal methods are followed.",
      measurement:
        "Visual inspection of waste accumulation in and around the project area.",
    },
    {
      code: "D",
      name: "Level of Recycling or Reuse of Project Waste",
      definition:
        "Evaluates the percentage of the waste generated by the project is recycled, reused, safely disposed of, or dengorouse disposed of.",
      measurement: "Review of project waste management practices and records.",
    },
    {
      code: "E",
      name: "Number of Community Complaints About Radiation Concerns",
      definition:
        "Tracks reports from residents, workers, or local authorities about concerns related to radiation exposure from the project.",
      measurement:
        "Review community feedback, complaints, or surveys regarding radiation risks.",
    },
    {
      code: "E",
      name: "Observation of Signs of Radiation-Related Environmental Damage",
      definition:
        "Assesses whether there are visible signs of radiation exposure affecting plants, animals, or soil in the project area.",
      measurement:
        "Visual inspection of plant health, wildlife conditions, or unusual soil changes.",
    },
    {
      code: "E",
      name: "Reports of Health Issues Potentially Linked to Radiation Exposure",
      definition:
        "Monitors whether workers or nearby residents report symptoms or health conditions possibly linked to radiation.",
      measurement:
        "Review of health-related concerns raised in community discussions, workplace records, or local health authority reports",
    },
    {
      code: "F",
      name: "Toxic and Dangerous Materials Effect (Solid, Liquid, or Gas)– Indicators for Annual Monitoring",
      definition:
        "Tracks reports from residents, workers, or local authorities about concerns related to exposure to toxic or hazardous materials from the project.",
      measurement:
        "Review community feedback, complaints, or surveys regarding toxic material risks.",
    },
    {
      code: "F",
      name: "Observation of Visible Contamination or Unsafe Handling of Toxic Materials",
      definition:
        "Assesses whether there are visible signs of contamination (e.g., spills, improper storage, leaks) or unsafe handling of hazardous materials in the project area.",
      measurement:
        "Visual inspection of storage sites, waste disposal areas, or nearby land and water sources.",
    },
    {
      code: "F",
      name: "Reports of Health Issues Potentially Linked to Toxic Material Exposure",
      definition:
        "Monitors whether workers or nearby residents report symptoms or health conditions possibly linked to toxic material exposure.",
      measurement:
        "Review of health-related concerns raised in community discussions, workplace records, or local health authority reports.",
    },
    {
      code: "J",
      name: "Observation of Changes in Vegetation and Tree Cover",
      definition:
        "Assesses whether the project has led to noticeable changes in plant health, tree cover, or deforestation in the area.",
      measurement:
        "Visual assessment of vegetation health and tree coverage near the project site.",
    },
    {
      code: "J",
      name: "Reports of Wildlife Disturbance or Habitat Loss",
      definition:
        "Tracks community or expert reports on the decline of wildlife populations, changes in animal migration, or habitat destruction caused by the project.",
      measurement:
        "Review of reports from local communities, conservation groups, or ecological assessments.",
    },
    {
      code: "J",
      name: "Presence of Invasive Species in the Project Area",
      definition:
        "Evaluates whether new invasive plant or animal species have been introduced due to project activities, impacting native ecosystems.",
      measurement:
        "Visual inspection of invasive species presence, combined with reports from local environmental monitoring groups.",
    },
    {
      code: "H",
      name: "Observation of Changes in Land Use and Aesthetic Impact",
      definition:
        "Assesses whether the project has visibly altered the landscape, disrupted scenic areas, or changed land use patterns.",
      measurement:
        "Visual assessment of land use changes and aesthetic impact near the project site.",
    },
    {
      code: "H",
      name: "Reports of Community Concerns About Social or Economic Impact",
      definition:
        "Tracks feedback from residents, businesses, or local authorities regarding changes in economic activity, social structures, or community well-being due to the project.",
      measurement:
        "Review of community feedback, surveys, or discussions about economic and social impacts.",
    },
    {
      code: "H",
      name: "Impact on Infrastructure and Public Services",
      definition:
        "Evaluates whether the project has increased pressure on roads, utilities, schools, or healthcare facilities.",
      measurement:
        "Observations of infrastructure conditions and review of reports on service capacity issues.",
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
