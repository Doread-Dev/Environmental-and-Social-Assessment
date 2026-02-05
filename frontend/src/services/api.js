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

// Create Axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
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
 * Handles 401 Unauthorized responses globally by:
 * - Clearing stored token
 * - Redirecting to login page
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
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

    return Promise.reject(error)
  }
)

/**
 * Extract user-friendly error message from Axios error
 * @param {Error} error - Axios error object
 * @returns {string} Human-readable error message
 */
export function extractErrorMessage(error) {
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

/**
 * Check if error is a network/connectivity error
 * @param {Error} error - Axios error object
 * @returns {boolean}
 */
export function isNetworkError(error) {
  return error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || !error.response
}

/**
 * Check if error is an authentication error
 * @param {Error} error - Axios error object
 * @returns {boolean}
 */
export function isAuthError(error) {
  return error.response?.status === 401 || error.response?.status === 403
}

export default api
