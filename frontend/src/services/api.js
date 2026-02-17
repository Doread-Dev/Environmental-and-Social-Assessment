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
  // No localhost fallback: set VITE_API_URL in .env / Vercel so production fails fast if missing
  baseURL: import.meta.env.DEV ? (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1') : import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT, 10) || 30000,
})

/**
 * Request Interceptor
 * Attaches JWT token to all outgoing requests if available
 * Marks requests with silent404 flag for console error suppression
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Mark requests with silent404 for console error suppression
    if (config.silent404) {
      silent404Requests.add(config)
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
 * - Silently handling expected 404 errors when requested
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

    // Silently handle 404 errors when explicitly requested (for expected "not found" cases)
    // This prevents console noise for legitimate "resource doesn't exist yet" scenarios
    // Example: getByProject for a new project (no screening/assessment exists yet)
    // Note: Network tab will still show 404 (browser behavior), but console.error won't fire
    if (error.response?.status === 404 && error.config?.silent404) {
      // Mark error as handled to prevent default console.error
      error.isExpected404 = true
      
      // The error will still be returned to the caller for proper handling
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

// Suppress console.error for expected 404s (when silent404 flag is set)
// This prevents console noise for legitimate "resource doesn't exist yet" scenarios
// Example: getByProject for a new project (no screening/assessment exists yet)
// Note: Network tab will still show 404 (browser behavior), which is useful for debugging

// Store requests with silent404 flag to suppress their console errors
const silent404Requests = new WeakSet()

// Override console.error to filter out expected 404 errors
// This must be done BEFORE axios makes requests to catch errors from dispatchXhrRequest
const originalConsoleError = console.error
console.error = (...args) => {
  // Convert all arguments to string for pattern matching
  const allArgsAsString = args.map(arg => {
    if (typeof arg === 'string') return arg
    if (typeof arg === 'object' && arg !== null) {
      // Check axios error objects
      if (arg.config?.silent404 && arg.response?.status === 404) {
        return 'SUPPRESS_404'
      }
      // Check error messages
      if (arg.message) return arg.message
      if (arg.stack) return arg.stack
      return JSON.stringify(arg)
    }
    return String(arg)
  }).join(' ')
  
  // Check if this is a 404 error for a /project/ endpoint (expected 404s)
  // These are legitimate "resource doesn't exist yet" scenarios for new projects
  const isExpected404 = 
    allArgsAsString.includes('404') && 
    (allArgsAsString.includes('/screenings/project/') || 
     allArgsAsString.includes('/assessments/project/') ||
     allArgsAsString.includes('/management/project/') ||
     allArgsAsString.includes('/mitigation/project/') ||
     allArgsAsString.includes('/monitoring/project/') ||
     allArgsAsString.includes('SUPPRESS_404'))
  
  if (isExpected404) {
    // Suppress this specific error - it's an expected 404 for new projects
    return
  }
  
  // Call original console.error for all other errors
  originalConsoleError.apply(console, args)
}

/**
 * Extract user-friendly error message from Axios error
 * @param {Error} error - Axios error object
 * @returns {string} Human-readable error message
 */
export function extractErrorMessage(error) {
  // 403 Forbidden: consistent user-friendly message
  if (error.response?.status === 403) {
    return "You don't have permission to perform this action."
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
