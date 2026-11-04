// Services Barrel Export
// Core API instance and utilities
export { default as api, extractErrorMessage, isNetworkError, isAuthError } from './api'

// Auth service
export { authService } from './authService'

// Lookup service
export { lookupService } from './lookupService'

// Project service
export { projectService } from './projectService'

// User service
export { userService } from './userService'

// Service modules (uncomment as implemented)
export { screeningService } from './screeningService'
export { assessmentService } from './assessmentService'
export { sempService } from './sempService'
export { monitoringService } from './monitoringService'
export { fileService } from './fileService'
export { auditLogService } from './auditLogService'
// export { reportService } from './reportService'

// Query cache (D33)
export { queryClient, createQueryClient } from './queryClient'
export { queryKeys, invalidateProjectState } from './queryKeys'
