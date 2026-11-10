/**
 * Core API Service Module
 *
 * Provides configured Axios instance with:
 * - Base URL from environment variables
 * - JWT token injection via request interceptor
 * - Global 401 handling via response interceptor
 * - Standardized error extraction
 */
import axios from 'axios'

// The backend's 403 code while a forced password change is pending (D22), and the screen for it
// (ROUTES.CHANGE_PASSWORD; not imported to keep this module free of routing code).
export const PASSWORD_CHANGE_REQUIRED = 'PASSWORD_CHANGE_REQUIRED'
const CHANGE_PASSWORD_PATH = '/change-password'

// The backend's 409 code for a stale save (D62, D73): someone else changed the record or table
// since this page loaded it. useProjectSave shows it in the shared conflict dialog.
export const STALE_VERSION = 'STALE_VERSION'

/**
 * Is this the 409 of a stale save (D62)?
 * @param {Error} error - Axios error
 */
export function isStaleVersionError(error) {
  return error?.response?.status === 409 && error.response.data?.code === STALE_VERSION
}

// Shown where a request failed because the session expired while the user was working (D73):
// the sign-in dialog opens over the page and nothing typed is lost.
export const SESSION_EXPIRED_MESSAGE =
  'Your session has expired. Sign in again to continue; what you typed is kept.'

// Set by AuthProvider while a signed-in user is loaded. Called on a 401: returns true when it
// takes over (opens the sign-in dialog over the page), false to fall back to the login page.
let sessionExpiredHandler = null

/**
 * @param {(() => boolean) | null} handler
 */
export function setSessionExpiredHandler(handler) {
  sessionExpiredHandler = handler
}

// The sign-in request answers 401 for a wrong password: never a session expiry.
const isLoginRequest = (config) => /\/auth\/login$/.test(config?.url ?? '')

/**
 * Base URL of the API (D38, phase 11). VITE_API_URL wins when it is set (the Vercel deployment and
 * its previews, or a dev backend on another port). Without it the production build calls its own
 * origin (`/api/v1`: Express serves the app and the API together on the server), and `npm run dev`
 * calls the local backend on port 3000.
 * @param {{ VITE_API_URL?: string, DEV?: boolean }} env - import.meta.env
 */
export function apiBaseUrl(env) {
  if (env.VITE_API_URL) return env.VITE_API_URL
  return env.DEV ? 'http://localhost:3000/api/v1' : '/api/v1'
}

// Create Axios instance with base configuration
const api = axios.create({
  baseURL: apiBaseUrl(import.meta.env),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT, 10) || 30000,
})

/**
 * Request Interceptor
 * Attaches JWT token to all outgoing requests if available
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

/**
 * Response Interceptor
 * A 401 while a signed-in user is loaded (the token expired mid-session, or the account was
 * deactivated) opens the sign-in dialog over the page, so typed input is kept (D73); the request
 * is rejected with `sessionExpired` set and is never retried on its own. A 401 with no user loaded
 * (first load, bad token) clears the session and goes to the login page. 403
 * PASSWORD_CHANGE_REQUIRED (an admin reset the password, D22) goes to the change-password screen.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !isLoginRequest(error.config) &&
      sessionExpiredHandler?.()
    ) {
      error.sessionExpired = true
      return Promise.reject(error)
    }

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401 && !isLoginRequest(error.config)) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        // Store intended destination for post-login redirect
        const currentPath = window.location.pathname + window.location.search
        sessionStorage.setItem('redirectAfterLogin', currentPath)
        window.location.href = '/login'
      }
    }

    if (
      error.response?.status === 403 &&
      error.response.data?.code === PASSWORD_CHANGE_REQUIRED &&
      window.location.pathname !== CHANGE_PASSWORD_PATH
    ) {
      window.location.href = CHANGE_PASSWORD_PATH
    }

    return Promise.reject(error)
  }
)

/**
 * Extract user-friendly error message from Axios error
 * @param {Error} error - Axios error object
 * @returns {string} Human-readable error message
 */
export function extractErrorMessage(error) {
  if (error?.sessionExpired) return SESSION_EXPIRED_MESSAGE

  // 403 Forbidden (wrong role): consistent user-friendly message. Other 403s carry their own
  // reason, e.g. "Account is deactivated" or a pending password change.
  if (error.response?.status === 403) {
    const reason = error.response.data?.error
    return reason && reason !== 'Forbidden'
      ? reason
      : "You don't have permission to perform this action."
  }

  // Server responded with error
  if (error.response?.data?.message) {
    return error.response.data.message
  }

  // Server responded with error string
  if (error.response?.data?.error) {
    return error.response.data.error
  }

  // Network error or timeout
  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.'
  }

  if (error.code === 'ERR_NETWORK') {
    return 'Network error. Please check your connection.'
  }

  // Generic error message
  if (error.message) {
    return error.message
  }

  return 'An unexpected error occurred. Please try again.'
}

export default api
