/**
 * Authentication Service
 * Handles login, logout, and user registration API calls
 */
import api from './api'

/**
 * Storage keys for auth data
 */
const TOKEN_KEY = 'token'
const USER_KEY = 'user'

/**
 * Auth Service Object
 */
export const authService = {
  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{user: Object, token: string}>}
   */
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password })
    const { user, token } = response.data.data

    // Store auth data
    this.setAuthData(user, token)

    return { user, token }
  },

  /**
   * Register a new user (requires environmental_specialist role)
   * @param {Object} userData - User registration data
   * @param {string} userData.name - User full name
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.role - User role
   * @param {string} userData.job_title - Job title ID
   * @returns {Promise<{user: Object, token: string}>}
   */
  async register(userData) {
    const response = await api.post('/auth/register', userData)
    return response.data.data
  },

  /**
   * Logout - Clear stored auth data
   */
  logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },

  /**
   * Store auth data in localStorage
   * @param {Object} user - User object
   * @param {string} token - JWT token
   */
  setAuthData(user, token) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  /**
   * Get stored token
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },

  /**
   * Get stored user
   * @returns {Object|null}
   */
  getUser() {
    const userStr = localStorage.getItem(USER_KEY)
    if (!userStr) return null

    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  },

  /**
   * Check if user is authenticated (has valid token)
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.getToken()
  },

  /**
   * Check if stored token appears valid (not expired)
   * Note: This is a client-side check only; server validates actual expiry
   * @returns {boolean}
   */
  isTokenValid() {
    const token = this.getToken()
    if (!token) return false

    try {
      // Decode JWT payload (middle part)
      const payload = JSON.parse(atob(token.split('.')[1]))

      // Check expiry (exp is in seconds, Date.now() is in milliseconds)
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // Token expired, clean up
        this.logout()
        return false
      }

      return true
    } catch {
      // Invalid token format
      return false
    }
  },
}

export default authService
