/**
 * Monitoring Service
 * Handles monitoring record CRUD and quarterly score updates
 */
import api from './api'

/**
 * Monitoring Service Object
 */
export const monitoringService = {
  /**
   * Get all monitoring records for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Array of monitoring records
   */
  async getByProject(projectId) {
    try {
      const response = await api.get(`/monitoring/project/${projectId}`, {
        silent404: true, // Suppress console error for expected 404 (new project)
        validateStatus: (status) => status === 200 || status === 404, // Don't throw on 404
      })
      // 404 means no records yet - return empty array
      if (response.status === 404) {
        return []
      }
      return response.data.data || []
    } catch (error) {
      // Only throw if it's not a 404
      if (error.response?.status !== 404) {
        throw error
      }
      return []
    }
  },

  /**
   * Create a new monitoring record
   * @param {Object} data - Record data
   * @param {string} data.project - Project ID
   * @param {string} data.indicator - Indicator ID
   * @param {Object} [data.scores] - Quarterly scores { baseline, Q1, Q2, Q3, Q4 }
   * @param {string} [data.total] - Total score
   * @param {string} [data.final_assessment] - Final assessment
   * @param {string} [data.ranking] - Ranking level
   * @param {string} [data.responsible] - Responsible user ID
   * @param {string} [data.note] - Notes
   * @returns {Promise<Object>} Created record
   */
  async create(data) {
    const response = await api.post('/monitoring', data)
    return response.data.data
  },

  /**
   * Update a monitoring record
   * @param {string} id - Record ID
   * @param {Object} data - Updated fields
   * @returns {Promise<Object>} Updated record
   */
  async update(id, data) {
    const response = await api.put(`/monitoring/${id}`, data)
    return response.data.data
  },

  /**
   * Update a specific quarter score
   * @param {string} id - Record ID
   * @param {string} quarter - Quarter key (baseline, Q1, Q2, Q3, Q4)
   * @param {string} value - Score value
   * @returns {Promise<Object>} Updated record
   */
  async updateQuarter(id, quarter, value) {
    const response = await api.patch(`/monitoring/${id}/quarter/${quarter}`, {
      value,
    })
    return response.data.data
  },
}

export default monitoringService
