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
   * List users. Admins get every account (inactive ones included); other roles get the active
   * users with picker fields only (name, job title).
   * @returns {Promise<Array>} Array of users
   */
  async getAll() {
    const response = await api.get('/users')
    return response.data.data
  },

  /**
   * Create a user (admin). The server generates a temporary password, returned once (D22).
   * @param {{name: string, email: string, role: string, job_title?: string|null}} data
   * @returns {Promise<{user: Object, temporary_password: string}>}
   */
  async create(data) {
    const response = await api.post('/users', data)
    return response.data.data
  },

  /**
   * Update name, role and job title (admin)
   * @param {string} id
   * @param {{name?: string, role?: string, job_title?: string|null}} data
   * @returns {Promise<Object>} The updated user
   */
  async update(id, data) {
    const response = await api.put(`/users/${id}`, data)
    return response.data.data
  },

  /** @returns {Promise<Object>} The deactivated user (admin) */
  async deactivate(id) {
    const response = await api.patch(`/users/${id}/deactivate`)
    return response.data.data
  },

  /** @returns {Promise<Object>} The reactivated user (admin) */
  async reactivate(id) {
    const response = await api.patch(`/users/${id}/reactivate`)
    return response.data.data
  },

  /**
   * New temporary password (admin); the user must change it at next login (D22)
   * @returns {Promise<{user: Object, temporary_password: string}>}
   */
  async resetPassword(id) {
    const response = await api.post(`/users/${id}/reset-password`)
    return response.data.data
  },
}

export default userService
