/**
 * User Roles - متوافق مع Backend
 * backend/src/models/user.model.js
 */
export const USER_ROLES = {
  ENVIRONMENTAL_SPECIALIST: 'environmental_specialist',
  PROGRAM_MANAGER: 'program_manager',
  PROJECT_MANAGER: 'project_manager',
  ENVIRONMENTAL_FOCAL_POINT: 'environmental_focal_point',
  VIEWER: 'viewer',
}

/**
 * Role Labels للعرض في UI
 */
export const ROLE_LABELS = {
  environmental_specialist: 'Environmental Specialist',
  program_manager: 'Program Manager',
  project_manager: 'Project Manager',
  environmental_focal_point: 'Environmental Focal Point',
  viewer: 'Viewer',
}

/**
 * Job Titles - متوافق مع backend/src/models/jobTitle.model.js
 */
export const mockJobTitles = [
  { _id: '507f1f77bcf86cd799439101', title_name: 'Environmental Specialist' },
  { _id: '507f1f77bcf86cd799439102', title_name: 'Program Manager' },
  { _id: '507f1f77bcf86cd799439103', title_name: 'Project Manager' },
  { _id: '507f1f77bcf86cd799439104', title_name: 'Environmental focal point' },
  { _id: '507f1f77bcf86cd799439105', title_name: 'Viewer' },
]

/**
 * Mock Users Data
 * متوافق مع backend/src/models/user.model.js
 */
export const mockUsers = [
  {
    _id: '507f1f77bcf86cd799439001',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@akdn.org',
    job_title: mockJobTitles[1], // Program Manager
    role: USER_ROLES.PROGRAM_MANAGER,
    is_active: true,
    createdAt: '2023-01-15T10:00:00.000Z',
    updatedAt: '2024-01-10T08:00:00.000Z',
    // Frontend-only fields for display
    avatar: null,
  },
  {
    _id: '507f1f77bcf86cd799439002',
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@akdn.org',
    job_title: mockJobTitles[0], // Environmental Specialist
    role: USER_ROLES.ENVIRONMENTAL_SPECIALIST,
    is_active: true,
    createdAt: '2023-03-20T09:00:00.000Z',
    updatedAt: '2024-02-15T11:00:00.000Z',
    avatar: null,
  },
  {
    _id: '507f1f77bcf86cd799439003',
    name: 'Maria Santos',
    email: 'maria.santos@akdn.org',
    job_title: mockJobTitles[2], // Project Manager
    role: USER_ROLES.PROJECT_MANAGER,
    is_active: true,
    createdAt: '2023-06-10T08:00:00.000Z',
    updatedAt: '2024-03-01T10:00:00.000Z',
    avatar: null,
  },
  {
    _id: '507f1f77bcf86cd799439004',
    name: 'John Smith',
    email: 'john.smith@akdn.org',
    job_title: mockJobTitles[3], // Environmental focal point
    role: USER_ROLES.ENVIRONMENTAL_FOCAL_POINT,
    is_active: true,
    createdAt: '2023-09-01T07:00:00.000Z',
    updatedAt: '2024-01-20T09:00:00.000Z',
    avatar: null,
  },
  {
    _id: '507f1f77bcf86cd799439005',
    name: 'Guest User',
    email: 'guest@akdn.org',
    job_title: mockJobTitles[4], // Viewer
    role: USER_ROLES.VIEWER,
    is_active: true,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    avatar: null,
  },
]

/**
 * المستخدم الحالي (للـ Mock)
 */
export const currentUser = mockUsers[0]

/**
 * الحصول على اسم العرض للدور
 * @param {string} role - رمز الدور
 * @returns {string} - اسم العرض
 */
export function getRoleDisplayName(role) {
  return ROLE_LABELS[role] || role
}
