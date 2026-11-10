/**
 * Screening Service
 * Handles screening CRUD and workflow actions
 */
import api from './api'

export const screeningService = {
  /**
   * Get screening by project ID
   * @param {string} projectId
   * @returns {Promise<Object|null>} Screening, or null when not started yet
   */
  async getByProject(projectId) {
    const response = await api.get(`/screenings/project/${projectId}`)
    return response.data.data
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
   * Submit a screening for approval (draft|rejected → submitted)
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async submit(id, version) {
    // `version` = the `updatedAt` of the screening the user saw (D62)
    const response = await api.patch(`/screenings/${id}/submit`, { version })
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
