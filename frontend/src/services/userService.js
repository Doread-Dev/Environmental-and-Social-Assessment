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
   * Get all users (requires authentication, not available for viewers)
   * @returns {Promise<Array>} Array of users
   */
  async getAll() {
    const response = await api.get('/users')
    return response.data.data
  },

  /**
   * Get active users only (filtered locally)
   * @returns {Promise<Array>} Array of active users
   */
  async getActive() {
    const users = await this.getAll()
    return users.filter((user) => user.is_active)
  },
}

export default userService
