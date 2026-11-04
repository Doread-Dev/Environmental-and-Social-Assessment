const path = require("path");

// Project file module (D47): one owner (the project), two areas.
const FILE_AREAS = ["annex", "semp_record"];

// Annex A–H (fixed list, labels live in the frontend's annexTypes.js).
const ANNEX_CATEGORIES = [
  "annex_a",
  "annex_b",
  "annex_c",
  "annex_d",
  "annex_e",
  "annex_f",
  "annex_g",
  "annex_h",
];

// SEMP Plan §7 "Project files & records" (the 11 record types of the SE MP workbook, §6.1).
// A semp_record file may also have no category (null).
const SEMP_RECORD_CATEGORIES = [
  "legal_register",
  "semp_with_annexes",
  "waste_management",
  "se_meeting_minutes",
  "weekly_site_inspections",
  "quarterly_hse_reports",
  "incident_investigations",
  "emergency_drills",
  "training_records",
  "se_correspondence",
  "audit_records",
];

// SEMP Plan §7 is locked until v3 (D48): the model and categories exist, the area answers 404.
// A code constant on purpose — no env switch can open it.
const OPEN_AREAS = ["annex"];

// Allowed types (owner, phase 7: PDF + Office). The extension decides the type; the stored MIME
// type comes from here, never from the client. `signature` = the file's first bytes.
const PDF = "%PDF-";
const ZIP = "PK\u0003\u0004"; // OOXML and OpenDocument files are zip containers
const OLE = "ÐÏ\u0011à¡±\u001aá"; // legacy .doc/.xls/.ppt
const FILE_TYPES = {
  pdf: { mime: "application/pdf", signature: PDF },
  doc: { mime: "application/msword", signature: OLE },
  docx: {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    signature: ZIP,
  },
  xls: { mime: "application/vnd.ms-excel", signature: OLE },
  xlsx: {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    signature: ZIP,
  },
  ppt: { mime: "application/vnd.ms-powerpoint", signature: OLE },
  pptx: {
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    signature: ZIP,
  },
  odt: { mime: "application/vnd.oasis.opendocument.text", signature: ZIP },
  ods: { mime: "application/vnd.oasis.opendocument.spreadsheet", signature: ZIP },
  odp: { mime: "application/vnd.oasis.opendocument.presentation", signature: ZIP },
};
const ALLOWED_EXTENSIONS = Object.keys(FILE_TYPES);

const DEFAULT_MAX_UPLOAD_MB = 10;

// Read at call time so tests (and a restart with a new .env) see the current value.
const maxUploadBytes = () => {
  const mb = Number(process.env.MAX_UPLOAD_MB);
  return Math.round((mb > 0 ? mb : DEFAULT_MAX_UPLOAD_MB) * 1024 * 1024);
};

// Files live at <UPLOADS_DIR>/<project id>/<stored name>. Backups must include this folder (D38).
// "10 MB", for messages.
const maxUploadLabel = () => `${Number((maxUploadBytes() / 1024 / 1024).toFixed(2))} MB`;

const uploadsDir = () =>
  path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, "..", "..", "uploads"));

module.exports = {
  FILE_AREAS,
  OPEN_AREAS,
  ANNEX_CATEGORIES,
  SEMP_RECORD_CATEGORIES,
  FILE_TYPES,
  ALLOWED_EXTENSIONS,
  maxUploadBytes,
  maxUploadLabel,
  uploadsDir,
};
