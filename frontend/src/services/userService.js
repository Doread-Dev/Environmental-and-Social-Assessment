/**
 * User Service
 * Handles user-related API calls
 */
import api from './api'

/**
 * User Service Object
 */
export const userService = {
  /**
   * Get all users (every signed-in role, viewer included)
   * @returns {Promise<Array>} Array of users
   */
  async getAll() {
    const response = await api.get('/users')
    return response.data.data
  },
}

export default userService
