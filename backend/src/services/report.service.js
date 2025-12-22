const Project = require("../models/project.model");
const Screening = require("../models/screening.model");
const Assessment = require("../models/assessment.model");
const Monitoring = require("../models/monitoringRecord.model");
const Management = require("../models/managementActivity.model");
const Mitigation = require("../models/mitigationPlan.model");

const countByField = async (Model, field) => {
  const pipeline = [
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  ];
  const rows = await Model.aggregate(pipeline);
  return rows.reduce((acc, r) => {
    acc[r._id || "unknown"] = r.count;
    return acc;
  }, {});
};

const getDashboardStats = async () => {
  const [
    totalProjects,
    screeningByStatus,
    assessmentByStatus,
    monitoringCount,
    managementCount,
    mitigationCount,
  ] = await Promise.all([
    Project.countDocuments(),
    countByField(Screening, "status"),
    countByField(Assessment, "status"),
    Monitoring.countDocuments(),
    Management.countDocuments(),
    Mitigation.countDocuments(),
  ]);

  return {
    totalProjects,
    screening: {
      byStatus: screeningByStatus,
    },
    assessments: {
      byStatus: assessmentByStatus,
    },
    monitoring: {
      total: monitoringCount,
    },
    management: {
      total: managementCount,
    },
    mitigation: {
      total: mitigationCount,
    },
  };
};

const toCsv = (rows) => {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const headerLine = headers.join(",");
  const dataLines = rows.map((r) =>
    headers
      .map((h) => {
        const val = r[h];
        if (val === undefined || val === null) return "";
        const str = String(val).replace(/"/g, '""');
        if (str.includes(",") || str.includes("\n")) return `"${str}"`;
        return str;
      })
      .join(",")
  );
  return [headerLine, ...dataLines].join("\n");
};

const exportCsv = async ({ type, projectId }) => {
  if (type === "projects") {
    const data = await Project.find().lean();
    const rows = data.map((p) => ({
      id: p._id,
      title: p.title,
      location: p.location,
      start_date: p.start_date,
      end_date: p.end_date,
      created_at: p.createdAt,
    }));
    return { filename: "projects.csv", content: toCsv(rows) };
  }

  if (type === "monitoring") {
    const query = projectId ? { project: projectId } : {};
    const data = await Monitoring.find(query)
      .populate("project indicator", "title name code")
      .lean();
    const rows = data.map((m) => ({
      id: m._id,
      project: m.project?.title,
      indicator: m.indicator?.name,
      baseline: m.scores?.baseline ?? "",
      q1: m.scores?.Q1 ?? "",
      q2: m.scores?.Q2 ?? "",
      q3: m.scores?.Q3 ?? "",
      q4: m.scores?.Q4 ?? "",
      total: m.total ?? "",
      final_assessment: m.final_assessment ?? "",
      ranking: m.ranking ?? "",
    }));
    return { filename: "monitoring.csv", content: toCsv(rows) };
  }

  throw new Error("Unsupported export type");
};

module.exports = {
  getDashboardStats,
  exportCsv,
};

