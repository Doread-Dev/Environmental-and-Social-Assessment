/**
 * Job Titles
 * المسميات الوظيفية
 * ⚠️ هذه البيانات مطابقة لـ backend/src/db/seed.js
 */

export const JOB_TITLES = {
  ENVIRONMENTAL_SPECIALIST: 'Environmental Specialist',
  PROGRAM_MANAGER: 'Program Manager',
  PROJECT_MANAGER: 'Project Manager',
  ENVIRONMENTAL_FOCAL_POINT: 'Environmental focal point',
  VIEWER: 'Viewer',
}

export const jobTitles = [
  { id: 'env_specialist', title_name: JOB_TITLES.ENVIRONMENTAL_SPECIALIST },
  { id: 'prog_manager', title_name: JOB_TITLES.PROGRAM_MANAGER },
  { id: 'proj_manager', title_name: JOB_TITLES.PROJECT_MANAGER },
  { id: 'env_focal', title_name: JOB_TITLES.ENVIRONMENTAL_FOCAL_POINT },
  { id: 'viewer', title_name: JOB_TITLES.VIEWER },
]

/**
 * الحصول على المسمى الوظيفي بالمعرف
 */
export function getJobTitleById(id) {
  return jobTitles.find((j) => j.id === id)
}
