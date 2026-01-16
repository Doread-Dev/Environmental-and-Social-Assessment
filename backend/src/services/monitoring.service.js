const MonitoringRecord = require("../models/monitoringRecord.model");
const ApiError = require("../utils/ApiError");

const listMonitoring = async () =>
  MonitoringRecord.find()
    .populate("project indicator responsible")
    .sort({ createdAt: -1 });

const getMonitoringRecord = async (id) => {
  const record = await MonitoringRecord.findById(id).populate(
    "project indicator responsible"
  );
  if (!record) throw new ApiError(404, "Monitoring record not found");
  return record;
};

const getByProject = async (projectId) =>
  MonitoringRecord.find({ project: projectId }).populate(
    "project indicator responsible"
  );

const createRecord = async (payload) => MonitoringRecord.create(payload);

const updateRecord = async (id, payload) => {
  const updated = await MonitoringRecord.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new ApiError(404, "Monitoring record not found");
  return updated;
};

const updateQuarter = async (id, quarterKey, value) => {
  const record = await MonitoringRecord.findById(id);
  if (!record) throw new ApiError(404, "Monitoring record not found");

  if (!["baseline", "Q1", "Q2", "Q3", "Q4"].includes(quarterKey)) {
    throw new ApiError(400, "Invalid quarter key");
  }

  record.scores = record.scores || {};
  record.scores[quarterKey] = value; // value الآن String

  // لا يتم حساب total تلقائياً - سيتم إرساله من الفرونت

  await record.save();
  return record;
};

module.exports = {
  listMonitoring,
  getMonitoringRecord,
  getByProject,
  createRecord,
  updateRecord,
  updateQuarter,
};
