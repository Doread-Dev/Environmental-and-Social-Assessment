/**
 * Screening Service
 * Handles screening CRUD and workflow actions
 */
import api from './api'

export const screeningService = {
  /**
   * Get all screenings
   * @returns {Promise<Array>}
   */
  async getAll() {
    const response = await api.get('/screenings')
    return response.data.data
  },
  /**
   * Get screening by project ID
   * @param {string} projectId
   * @returns {Promise<Object|null>} Screening object or null if not found
   */
  async getByProject(projectId) {
    try {
      const response = await api.get(`/screenings/project/${projectId}`, {
        silent404: true, // Suppress console error for expected 404 (new project)
        validateStatus: (status) => status === 200 || status === 404, // Don't throw on 404
      })
      // 404 means no screening exists yet - return null
      if (response.status === 404) {
        return null
      }
      return response.data.data
    } catch (error) {
      // Only throw if it's not a 404
      if (error.response?.status !== 404) {
        throw error
      }
      return null
    }
  },

  /**
   * Create a screening
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    const response = await api.post('/screenings', data)
    return response.data.data
  },

  /**
   * Update a screening
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    const response = await api.put(`/screenings/${id}`, data)
    return response.data.data
  },

  /**
   * Approve a screening
   * @param {string} id
   * @param {string|null} recommendations
   * @returns {Promise<Object>}
   */
  async approve(id, recommendations) {
    const response = await api.patch(`/screenings/${id}/approve`, { recommendations })
    return response.data.data
  },

  /**
   * Reject a screening
   * @param {string} id
   * @param {string|null} rejectReason
   * @returns {Promise<Object>}
   */
  async reject(id, rejectReason) {
    const response = await api.patch(`/screenings/${id}/reject`, { reject_reason: rejectReason })
    return response.data.data
  },
}

export default screeningService
