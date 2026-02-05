/**
 * Authentication Context
 * Provides auth state and methods throughout the application
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { authService } from '@/services/authService'
import { extractErrorMessage } from '@/services/api'

/**
 * User roles constant for permission checks
 */
export const USER_ROLES = {
  ENVIRONMENTAL_SPECIALIST: 'environmental_specialist',
  PROGRAM_MANAGER: 'program_manager',
  PROJECT_MANAGER: 'project_manager',
  ENVIRONMENTAL_FOCAL_POINT: 'environmental_focal_point',
  VIEWER: 'viewer',
}

/**
 * Role hierarchy for permission comparisons
 * Higher index = more permissions
 */
const ROLE_HIERARCHY = [
  USER_ROLES.VIEWER,
  USER_ROLES.ENVIRONMENTAL_FOCAL_POINT,
  USER_ROLES.PROJECT_MANAGER,
  USER_ROLES.PROGRAM_MANAGER,
  USER_ROLES.ENVIRONMENTAL_SPECIALIST,
]

/**
 * Role display names
 */
export const ROLE_LABELS = {
  environmental_specialist: 'Environmental Specialist',
  program_manager: 'Program Manager',
  project_manager: 'Project Manager',
  environmental_focal_point: 'Environmental Focal Point',
  viewer: 'Viewer',
}

// Create context
const AuthContext = createContext(undefined)

/**
 * AuthProvider Component
 * Wraps the application to provide auth state
 */
export function AuthProvider({ children }) {
  // Core auth state
  const [user, setUser] = useState(() => authService.getUser())
  const [token, setToken] = useState(() => authService.getToken())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Derived state
  const isAuthenticated = useMemo(() => !!token && !!user, [token, user])

  /**
   * Initialize auth state on mount
   * Validates stored token and clears if expired
   */
  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = authService.getToken()
      const storedUser = authService.getUser()

      if (storedToken && storedUser) {
        // Validate token hasn't expired
        if (authService.isTokenValid()) {
          setToken(storedToken)
          setUser(storedUser)
        } else {
          // Token expired, clear auth state
          authService.logout()
          setToken(null)
          setUser(null)
        }
      }

      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const login = useCallback(async (email, password) => {
    setIsLoading(true)
    setError(null)

    try {
      const { user: userData, token: authToken } = await authService.login(email, password)

      setUser(userData)
      setToken(authToken)

      return { success: true }
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Logout user
   * Clears all auth state and storage
   */
  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
    setToken(null)
    setError(null)
  }, [])

  /**
   * Clear any auth errors
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Check if user has a specific role
   * @param {string} role - Role to check
   * @returns {boolean}
   */
  const hasRole = useCallback(
    (role) => {
      return user?.role === role
    },
    [user]
  )

  /**
   * Check if user has any of the specified roles
   * @param {string[]} roles - Array of roles to check
   * @returns {boolean}
   */
  const hasAnyRole = useCallback(
    (roles) => {
      return roles.includes(user?.role)
    },
    [user]
  )

  /**
   * Check if user has at least the specified role level
   * Based on role hierarchy
   * @param {string} minimumRole - Minimum role required
   * @returns {boolean}
   */
  const hasMinimumRole = useCallback(
    (minimumRole) => {
      if (!user?.role) return false

      const userRoleIndex = ROLE_HIERARCHY.indexOf(user.role)
      const minimumRoleIndex = ROLE_HIERARCHY.indexOf(minimumRole)

      return userRoleIndex >= minimumRoleIndex
    },
    [user]
  )

  /**
   * Permission helper: Can user edit/create content?
   */
  const canEdit = useMemo(() => {
    return hasAnyRole([
      USER_ROLES.ENVIRONMENTAL_SPECIALIST,
      USER_ROLES.PROGRAM_MANAGER,
      USER_ROLES.PROJECT_MANAGER,
    ])
  }, [hasAnyRole])

  /**
   * Permission helper: Can user approve/reject submissions?
   */
  const canApprove = useMemo(() => {
    return hasAnyRole([USER_ROLES.ENVIRONMENTAL_SPECIALIST, USER_ROLES.PROGRAM_MANAGER])
  }, [hasAnyRole])

  /**
   * Permission helper: Can user manage users?
   */
  const canManageUsers = useMemo(() => {
    return hasRole(USER_ROLES.ENVIRONMENTAL_SPECIALIST)
  }, [hasRole])

  /**
   * Permission helper: Can user update monitoring data?
   */
  const canUpdateMonitoring = useMemo(() => {
    return hasAnyRole([
      USER_ROLES.ENVIRONMENTAL_SPECIALIST,
      USER_ROLES.PROGRAM_MANAGER,
      USER_ROLES.PROJECT_MANAGER,
      USER_ROLES.ENVIRONMENTAL_FOCAL_POINT,
    ])
  }, [hasAnyRole])

  // Context value
  const value = useMemo(
    () => ({
      // State
      user,
      token,
      isAuthenticated,
      isLoading,
      error,

      // Actions
      login,
      logout,
      clearError,

      // Role checks
      hasRole,
      hasAnyRole,
      hasMinimumRole,

      // Permission helpers
      canEdit,
      canApprove,
      canManageUsers,
      canUpdateMonitoring,

      // Constants
      USER_ROLES,
      ROLE_LABELS,
    }),
    [
      user,
      token,
      isAuthenticated,
      isLoading,
      error,
      login,
      logout,
      clearError,
      hasRole,
      hasAnyRole,
      hasMinimumRole,
      canEdit,
      canApprove,
      canManageUsers,
      canUpdateMonitoring,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Custom hook to use auth context
 * @returns {Object} Auth context value
 * @throws {Error} If used outside of AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

export default AuthContext
