import { ROUTES } from './routes.config.js'

/**
 * Which part of the user guide (docs/user-guide, D78) the floating Help button opens on each page.
 *
 * Navigation config, not a permission rule: each page lists guide ids, most specific first, and the
 * Help page opens the first one the signed-in user's guide has (the server decides which parts
 * and sections that is), else the start of the guide. Ids are part or section ids of the guide; a
 * page with a place key lists its place key (backend tests/userGuide.test.js checks every id here
 * against both languages). A page missing here shows no Help button.
 */
export const HELP_SECTIONS = Object.freeze([
  [ROUTES.CHANGE_PASSWORD, ['first-password']],
  [ROUTES.DASHBOARD, ['dashboard']],
  [ROUTES.PROJECTS, ['project-list']],
  [ROUTES.PROJECT_NEW, ['project-create', 'project-list']],
  [ROUTES.PROJECT_OVERVIEW, ['project-overview']],
  [ROUTES.PROJECT_DOCUMENTS, ['project-documents']],
  [ROUTES.SCREENING, ['screening']],
  [ROUTES.SCREENING_SUMMARY, ['screening-review', 'screening-after-review', 'screening']],
  [ROUTES.ASSESSMENT, ['assessment']],
  [ROUTES.ASSESSMENT_METADATA, ['assessment-metadata', 'assessment']],
  [ROUTES.ASSESSMENT_METHODS, ['assessment-methods', 'assessment']],
  [ROUTES.ASSESSMENT_SCORING, ['assessment-scoring', 'assessment']],
  [ROUTES.ASSESSMENT_REVIEW, ['assessment-review', 'assessment-review-page', 'assessment']],
  [ROUTES.SEMP, ['semp-overview', 'semp']],
  [ROUTES.SEMP_ACTIVITIES, ['management']],
  [ROUTES.SEMP_MITIGATION, ['mitigation']],
  [ROUTES.MONITORING, ['monitoring-overview', 'monitoring']],
  [ROUTES.MONITORING_DATA, ['monitoring-data-entry', 'monitoring-reading', 'monitoring']],
  [ROUTES.LIBRARY, ['library']],
  [ROUTES.SETTINGS, ['users', 'settings-page']],
  [ROUTES.SETTINGS_ACTIVITY_LOG, ['activity-log']],
  [ROUTES.PROFILE, ['profile']],
])

// "/app/projects/:projectId/overview" matches "/app/projects/<any id>/overview" and nothing longer.
// Plain code with no router import, so the backend's guide test can read this file as it is.
const matches = (pattern, path) => {
  const want = pattern.split('/')
  const have = path.split('/')
  return (
    want.length === have.length && want.every((part, i) => part.startsWith(':') || part === have[i])
  )
}

/**
 * The guide ids for a page, or null on a page without the Help button (sign-in, the Help page)
 * @param {string} pathname
 * @returns {string[]|null}
 */
export function helpSectionsFor(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  const entry = HELP_SECTIONS.find(([pattern]) => matches(pattern, path))
  return entry ? entry[1] : null
}
