/**
 * Job Titles
 * Deprecated: use useLookups() for live data
 */

export const JOB_TITLES = {
  ENVIRONMENTAL_SPECIALIST: 'Environmental Specialist',
  PROGRAM_MANAGER: 'Program Manager',
  PROJECT_MANAGER: 'Project Manager',
  ENVIRONMENTAL_FOCAL_POINT: 'Environmental focal point',
  VIEWER: 'Viewer',
}

/**
 * @deprecated Use useLookups().jobTitles instead
 */
export const jobTitles = []

/**
 * @deprecated Use useLookups().getJobTitleById() instead
 */
export function getJobTitleById() {
  console.warn('getJobTitleById is deprecated. Use useLookups() hook instead.')
  return null
}
