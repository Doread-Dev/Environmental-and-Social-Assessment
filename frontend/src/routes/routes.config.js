/**
 * Application Route Constants
 * Centralized route definitions for the ESMS application
 */

export const ROUTES = {
  // ==========================================
  // Auth Routes
  // ==========================================
  LOGIN: '/login',

  // ==========================================
  // Main App Routes
  // ==========================================
  APP: '/app',
  DASHBOARD: '/app/dashboard',
  PROJECTS: '/app/projects',
  PROJECT_NEW: '/app/projects/new',

  // ==========================================
  // Project Workspace Routes (dynamic :projectId)
  // ==========================================
  PROJECT_BASE: '/app/projects/:projectId',
  PROJECT_OVERVIEW: '/app/projects/:projectId/overview',

  // Screening (Tool 1)
  SCREENING: '/app/projects/:projectId/screening',
  SCREENING_SUMMARY: '/app/projects/:projectId/screening/summary',

  // Assessment (Tool 2)
  ASSESSMENT: '/app/projects/:projectId/assessment',
  ASSESSMENT_METADATA: '/app/projects/:projectId/assessment/metadata',
  ASSESSMENT_METHODS: '/app/projects/:projectId/assessment/methods',
  ASSESSMENT_SCORING: '/app/projects/:projectId/assessment/scoring',
  ASSESSMENT_REVIEW: '/app/projects/:projectId/assessment/review',

  // SEMP (Tools 3 & 4)
  SEMP: '/app/projects/:projectId/semp',
  SEMP_ACTIVITIES: '/app/projects/:projectId/semp/activities',
  SEMP_MITIGATION: '/app/projects/:projectId/semp/mitigation',

  // Monitoring (Tool 5)
  MONITORING: '/app/projects/:projectId/monitoring',
  MONITORING_DATA: '/app/projects/:projectId/monitoring/data-entry',

  // Files & Annex
  PROJECT_FILES: '/app/projects/:projectId/files',
  PROJECT_ANNEX: '/app/projects/:projectId/annex',
}

/**
 * Helper function to generate project-specific routes
 * @param {string} projectId - The project ID
 * @param {string} route - The route constant with :projectId placeholder
 * @returns {string} - The resolved route path
 *
 * @example
 * getProjectRoute('123', ROUTES.PROJECT_OVERVIEW)
 * // Returns: '/app/projects/123/overview'
 */
export function getProjectRoute(projectId, route) {
  return route.replace(':projectId', projectId)
}

/**
 * Navigation items for MainSidebar
 */
export const MAIN_NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    path: ROUTES.DASHBOARD,
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: 'folder_open',
    path: ROUTES.PROJECTS,
  },
]

/**
 * Navigation items for ProjectSidebar - Workflow Tools
 */
export const PROJECT_WORKFLOW_NAV = [
  {
    id: 'overview',
    label: 'Project Overview',
    icon: 'dashboard',
    path: 'overview',
    filled: true,
  },
  {
    id: 'screening',
    label: 'Screening – Tool 1',
    icon: 'check_circle',
    path: 'screening',
  },
  {
    id: 'assessment',
    label: 'Assessment – Tool 2',
    icon: 'assessment',
    path: 'assessment',
    children: [
      { id: 'assessment-metadata', label: 'Metadata', path: 'assessment/metadata' },
      { id: 'assessment-methods', label: 'Methods', path: 'assessment/methods' },
      { id: 'assessment-scoring', label: 'Scoring', path: 'assessment/scoring' },
    ],
  },
  {
    id: 'semp',
    label: 'SEMP – Tools 3 & 4',
    icon: 'edit_document',
    path: 'semp',
  },
  {
    id: 'monitoring',
    label: 'Monitoring – Tool 5',
    icon: 'monitoring',
    path: 'monitoring',
  },
]

/**
 * Secondary navigation items for ProjectSidebar
 */
export const PROJECT_SECONDARY_NAV = [
  {
    id: 'annex',
    label: 'Annex & Attachments',
    icon: 'folder_open',
    path: 'annex',
    children: [
      { id: 'attachments', label: 'Attachments', path: 'files' },
      { id: 'annex', label: 'Annex', path: 'annex' },
    ],
  },
]
