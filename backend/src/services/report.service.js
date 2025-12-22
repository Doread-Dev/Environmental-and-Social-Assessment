const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

const Project = require("../models/project.model");
const Screening = require("../models/screening.model");
const Assessment = require("../models/assessment.model");
const Monitoring = require("../models/monitoringRecord.model");
const Management = require("../models/managementActivity.model");
const Mitigation = require("../models/mitigationPlan.model");

const countByField = async (Model, field) => {
  const pipeline = [{ $group: { _id: `$${field}`, count: { $sum: 1 } } }];
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
    screeningByCategory,
  ] = await Promise.all([
    Project.countDocuments(),
    countByField(Screening, "status"),
    countByField(Assessment, "status"),
    Monitoring.countDocuments(),
    Management.countDocuments(),
    Mitigation.countDocuments(),
    countByField(Screening, "category_code"),
  ]);

  return {
    totalProjects,
    screening: {
      byStatus: screeningByStatus,
      byCategory: screeningByCategory,
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

const buildRows = async ({ type, projectId }) => {
  if (type === "projects") {
    const data = await Project.find().lean();
    return {
      filename: "projects",
      rows: data.map((p) => ({
        id: p._id,
        title: p.title,
        location: p.location,
        start_date: p.start_date,
        end_date: p.end_date,
        created_at: p.createdAt,
      })),
    };
  }

  if (type === "monitoring") {
    const query = projectId ? { project: projectId } : {};
    const data = await Monitoring.find(query)
      .populate("project indicator", "title name code")
      .lean();
    return {
      filename: "monitoring",
      rows: data.map((m) => ({
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
      })),
    };
  }

  throw new Error("Unsupported export type");
};

const exportCsv = async ({ type, projectId }) => {
  const { filename, rows } = await buildRows({ type, projectId });
  return {
    filename: `${filename}.csv`,
    content: toCsv(rows),
    contentType: "text/csv",
  };
};

const exportExcel = async ({ type, projectId }) => {
  const { filename, rows } = await buildRows({ type, projectId });
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(filename);
  if (rows.length) {
    sheet.columns = Object.keys(rows[0]).map((k) => ({ header: k, key: k }));
    sheet.addRows(rows);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return {
    filename: `${filename}.xlsx`,
    content: buffer,
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
};

const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (c) => chunks.push(c));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });

const exportPdf = async ({ type, projectId }) => {
  const { filename, rows } = await buildRows({ type, projectId });
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.fontSize(16).text(`Report: ${filename}`, { underline: true });
  doc.moveDown();
  if (!rows.length) {
    doc.text("No data available.");
  } else {
    const keys = Object.keys(rows[0]);
    rows.forEach((r, idx) => {
      doc.fontSize(12).text(`#${idx + 1}`);
      keys.forEach((k) => doc.text(`${k}: ${r[k] ?? ""}`));
      doc.moveDown();
    });
  }
  doc.end();
  const buffer = await streamToBuffer(doc);
  return {
    filename: `${filename}.pdf`,
    content: buffer,
    contentType: "application/pdf",
  };
};

const exportReport = async ({ type, projectId, format = "csv" }) => {
  if (format === "csv") return exportCsv({ type, projectId });
  if (format === "excel") return exportExcel({ type, projectId });
  if (format === "pdf") return exportPdf({ type, projectId });
  throw new Error("Unsupported export format");
};

module.exports = {
  getDashboardStats,
  exportReport,
};
