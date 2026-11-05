/**
 * Authentication Context
 * Provides auth state and methods throughout the application
 *
 * What the user may do comes from the backend (D35): GET /auth/me returns the role's
 * `permissions`; per-project `allowed_actions` (workspace, project list) add the workflow state.
 * The frontend keeps no role lists of its own.
 */
import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/services/authService'
import { extractErrorMessage, setSessionExpiredHandler } from '@/services/api'
import { queryKeys } from '@/services/queryKeys'
import { AuthContext } from './useAuth'
import { USER_ROLES, ROLE_LABELS } from '@/utils/roles'

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

/**
 * AuthProvider Component
 * Wraps the application to provide auth state (needs a QueryClientProvider above it)
 */
export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState(readStoredAuth)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState(null)
  // The token stopped working while this user was signed in (D73): the sign-in dialog is open
  // over the page; nothing is unmounted, so typed input stays.
  const [sessionExpired, setSessionExpired] = useState(false)

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

  // A 401 while a user is loaded opens the sign-in dialog instead of leaving the page (D73). With
  // no user loaded (first load, bad token) api.js still goes to the login page.
  const userLoaded = isAuthenticated && !!meQuery.data
  useEffect(() => {
    if (!userLoaded) return undefined
    setSessionExpiredHandler(() => {
      setSessionExpired(true)
      return true
    })
    return () => setSessionExpiredHandler(null)
  }, [userLoaded])

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
    setSessionExpired(false)
    queryClient.clear()
  }, [queryClient])

  /**
   * Sign in again after the session expired, as the same user, without leaving the page (D73).
   * The page and what was typed stay; writes are not retried (the user presses Save again);
   * reads that failed meanwhile are fetched again.
   * @param {string} password
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const reauthenticate = useCallback(
    async (password) => {
      const email = (meQuery.data?.user ?? session.user)?.email
      try {
        const { user: userData, token: authToken } = await authService.login(email, password)
        setSession({ user: userData, token: authToken })
        setSessionExpired(false)
        queryClient.invalidateQueries({ queryKey: queryKeys.me })
        queryClient.refetchQueries({ predicate: (query) => query.state.status === 'error' })
        return { success: true }
      } catch (err) {
        return { success: false, error: extractErrorMessage(err) }
      }
    },
    [meQuery.data, session.user, queryClient]
  )

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
      sessionExpired,

      // Actions
      login,
      logout,
      reauthenticate,
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
      sessionExpired,
      login,
      logout,
      reauthenticate,
      changePassword,
      clearError,
      can,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
