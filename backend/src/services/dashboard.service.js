const Project = require("../models/project.model");
const { PROJECT_STATUSES, withWorkflowState } = require("./workflow.service");

// Screening categories counted as high risk on the dashboard.
const HIGH_RISK_CATEGORIES = ["A", "B"];
const LATEST_COUNT = 5;

// Stats and the latest projects (with workflow state) in one call (D31). Archived projects are
// left out, like in the default project list. `accessFilter` comes from the project-access check
// (projectFilterFor, D66).
const getDashboard = async (user, accessFilter) => {
  const projects = await Project.find({ $and: [accessFilter, { archived: { $ne: true } }] })
    .sort({ updatedAt: -1 })
    .lean();
  const items = await withWorkflowState(projects, user);
  const count = (matches) => items.filter(matches).length;

  return {
    stats: {
      total_projects: items.length,
      by_status: Object.fromEntries(
        PROJECT_STATUSES.map((status) => [status, count((item) => item.workflow.status === status)])
      ),
      high_risk: count((item) => HIGH_RISK_CATEGORIES.includes(item.screening?.category_code)),
    },
    latest_projects: items.slice(0, LATEST_COUNT),
  };
};

module.exports = { getDashboard };
