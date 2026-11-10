/**
 * Application Route Constants
 * Centralized route definitions for the ESMS application
 */

export const ROUTES = {
  // ==========================================
  // Auth Routes
  // ==========================================
  LOGIN: '/login',
  // Forced password change after an admin reset or on a new account (D22)
  CHANGE_PASSWORD: '/change-password',

  // ==========================================
  // Main App Routes
  // ==========================================
  APP: '/app',
  DASHBOARD: '/app/dashboard',
  PROJECTS: '/app/projects',
  // Reference library (D64): organisation guidance
  LIBRARY: '/app/library',
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

  // Project documents (D64 d)
  PROJECT_DOCUMENTS: '/app/projects/:projectId/documents',

  // Settings
  SETTINGS: '/app/settings',
  // Critical-actions log (D65), admin only
  SETTINGS_ACTIVITY_LOG: '/app/settings/activity-log',

  // Own profile and password (D23)
  PROFILE: '/app/profile',

  // The in-app user guide (phase 14, D78); ?section=<id> opens it at a part or section
  HELP: '/app/help',
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
 * The Help page, optionally at a part or section of the guide (D78): one id, or several, most
 * specific first (the page opens the first one the user's guide has; routes/helpSections.js)
 * @param {string|string[]|null} [sections]
 * @returns {string}
 */
export function getHelpRoute(sections = null) {
  const ids = [sections ?? []].flat().filter(Boolean)
  return ids.length
    ? `${ROUTES.HELP}?section=${ids.map(encodeURIComponent).join(',')}`
    : ROUTES.HELP
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
  {
    id: 'library',
    label: 'Library',
    icon: 'menu_book',
    path: ROUTES.LIBRARY,
  },
  {
    id: 'help',
    label: 'Help',
    icon: 'help',
    path: ROUTES.HELP,
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
 * Where the locked v3 buttons sit (D48, D59), with the heading shown above them (if any)
 */
export const V3_LOCKED_LOCATIONS = Object.freeze({
  SEMP_OVERVIEW: 'semp_overview',
  PROJECT_SUPPORT: 'project_support',
  ORGANIZATION: 'organization',
})

export const V3_LOCKED_HEADINGS = Object.freeze({
  [V3_LOCKED_LOCATIONS.PROJECT_SUPPORT]: 'Project support tools',
  [V3_LOCKED_LOCATIONS.ORGANIZATION]: 'Organization tools',
})

/**
 * v3 modules shown as locked buttons (D48, D70). They are not links and have no route; no env
 * variable, query flag or role turns them on — building the module in v3 does. `place` is the
 * module's key in the backend places registry (D64 a).
 */
export const V3_LOCKED_NAV = Object.freeze([
  {
    id: 'semp-plan',
    label: 'SEMP Plan',
    icon: 'assignment',
    location: V3_LOCKED_LOCATIONS.SEMP_OVERVIEW,
    place: 'semp_plan',
    description:
      "The project's Social and Environmental Management Plan document: roles, responsibilities, objectives, training, incidents and records.",
  },
  {
    id: 'stakeholder-awareness',
    label: 'Stakeholder Awareness',
    icon: 'campaign',
    location: V3_LOCKED_LOCATIONS.PROJECT_SUPPORT,
    place: 'stakeholder_awareness',
  },
  {
    id: 'ghg-emissions',
    label: 'GHG Emissions',
    icon: 'co2',
    location: V3_LOCKED_LOCATIONS.ORGANIZATION,
    place: 'ghg_emissions',
  },
  {
    id: 'environmental-data',
    label: 'Environmental Data Collection',
    icon: 'dataset',
    location: V3_LOCKED_LOCATIONS.ORGANIZATION,
    place: 'environmental_data',
  },
])

/**
 * Secondary navigation items for ProjectSidebar
 */
export const PROJECT_SECONDARY_NAV = [
  {
    id: 'documents',
    label: 'Documents',
    icon: 'folder_open',
    path: 'documents',
  },
]
