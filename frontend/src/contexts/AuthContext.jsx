/**
 * Authentication Context
 * Provides auth state and methods throughout the application
 *
 * What the user may do comes from the backend (D35): GET /auth/me returns the role's
 * `permissions`; per-project `allowed_actions` (workspace, project list) add the workflow state.
 * The frontend keeps no role lists of its own.
 */
import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/services/authService'
import { extractErrorMessage } from '@/services/api'
import { queryKeys } from '@/services/queryKeys'

/**
 * Role names (display and the user form only — never used for permission checks)
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  ENVIRONMENTAL_SPECIALIST: 'environmental_specialist',
  PROGRAM_MANAGER: 'program_manager',
  PROJECT_MANAGER: 'project_manager',
  ENVIRONMENTAL_FOCAL_POINT: 'environmental_focal_point',
  VIEWER: 'viewer',
}

/**
 * Role display names
 */
export const ROLE_LABELS = {
  admin: 'Administrator',
  environmental_specialist: 'Environmental Specialist',
  program_manager: 'Program Manager',
  project_manager: 'Project Manager',
  environmental_focal_point: 'Environmental Focal Point',
  viewer: 'Viewer',
}

const NO_PERMISSIONS = []

// Stored session, dropped when the token has expired.
function readStoredAuth() {
  if (!authService.getToken() || !authService.getUser()) return { user: null, token: null }
  if (!authService.isTokenValid()) {
    authService.logout()
    return { user: null, token: null }
  }
  return { user: authService.getUser(), token: authService.getToken() }
}

// Create context
const AuthContext = createContext(undefined)

/**
 * AuthProvider Component
 * Wraps the application to provide auth state (needs a QueryClientProvider above it)
 */
export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState(readStoredAuth)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState(null)

  const isAuthenticated = !!session.token && !!session.user

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: authService.me,
    enabled: isAuthenticated,
    staleTime: Infinity,
  })

  const user = meQuery.data?.user ?? session.user
  const permissions = meQuery.data?.permissions ?? NO_PERMISSIONS
  const passwordRules = meQuery.data?.password_rules ?? null
  // Allowed file types and size, to check a file before uploading it (D47)
  const uploadRules = meQuery.data?.upload_rules ?? null
  // Set by an admin reset or on a new account (D22): the app shows only the change-password screen
  const mustChangePassword = !!user?.must_change_password
  // Wait for the permissions once per session so guards and buttons don't flicker.
  const isLoading = isLoggingIn || (isAuthenticated && meQuery.isPending)

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const login = useCallback(async (email, password) => {
    setIsLoggingIn(true)
    setError(null)

    try {
      const { user: userData, token: authToken } = await authService.login(email, password)
      setSession({ user: userData, token: authToken })
      return { success: true }
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoggingIn(false)
    }
  }, [])

  /**
   * Logout user
   * Clears all auth state, storage and cached data (the next user must not see it)
   */
  const logout = useCallback(() => {
    authService.logout()
    setSession({ user: null, token: null })
    setError(null)
    queryClient.clear()
  }, [queryClient])

  /**
   * Change own password (D23). Puts the fresh user/permissions into the cache, which also lifts a
   * forced change (D22). Throws the API error so the form can show it.
   * @param {string} currentPassword
   * @param {string} newPassword
   */
  const changePassword = useCallback(
    async (currentPassword, newPassword) => {
      const data = await authService.changePassword(currentPassword, newPassword)
      queryClient.setQueryData(queryKeys.me, data)
      setSession((prev) => ({ ...prev, user: data.user }))
      return data
    },
    [queryClient]
  )

  /**
   * Clear any auth errors
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Does the user's role have this permission (from GET /auth/me)?
   * @param {string} permission - e.g. 'edit', 'approve', 'export', 'manage_users'
   * @returns {boolean}
   */
  const can = useCallback((permission) => permissions.includes(permission), [permissions])

  // Context value
  const value = useMemo(
    () => ({
      // State
      user,
      token: session.token,
      isAuthenticated,
      isLoading,
      error,
      permissions,
      passwordRules,
      uploadRules,
      mustChangePassword,

      // Actions
      login,
      logout,
      changePassword,
      clearError,

      // Permission helpers
      can,
      canCreateProject: can('create_project'),
      canEdit: can('edit'),
      canExport: can('export'),
      canApprove: can('approve'),
      canManageUsers: can('manage_users'),
      canDeleteProject: can('delete_project'),
      canReadAuditLog: can('read_audit_log'),
      // Upload, edit, replace and delete reference library documents (D64 b)
      canManageLibrary: can('manage_library'),
      // Settings holds user management (admin) and project deletion (specialist/admin)
      canAccessSettings: can('manage_users') || can('delete_project'),

      // Constants
      USER_ROLES,
      ROLE_LABELS,
    }),
    [
      user,
      session.token,
      isAuthenticated,
      isLoading,
      error,
      permissions,
      passwordRules,
      uploadRules,
      mustChangePassword,
      login,
      logout,
      changePassword,
      clearError,
      can,
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
