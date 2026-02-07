/**
 * SEMP Service
 * Handles Management Activities (Tool 3) and Mitigation Plans (Tool 4) CRUD
 */
import api from './api'

/**
 * SEMP Service Object
 */
export const sempService = {
  // ==========================================
  // Management Activities (Tool 3)
  // ==========================================

  /**
   * Get all management activities for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Array of management activities
   */
  async getManagementActivities(projectId) {
    try {
      const response = await api.get(`/management/project/${projectId}`, {
        silent404: true, // Suppress console error for expected 404 (new project)
        validateStatus: (status) => status === 200 || status === 404, // Don't throw on 404
      })
      // 404 means no activities yet - return empty array
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
   * Create a management activity
   * @param {Object} data - Activity data
   * @param {string} data.project - Project ID
   * @param {string} data.activity_description - Activity description (required)
   * @param {number} [data.serial_number] - Serial number
   * @param {string} [data.potential_impact] - Potential impact
   * @param {string|string[]} [data.recommended_actions] - Recommended actions
   * @param {string} [data.monitoring_requirements] - Monitoring requirements
   * @param {string} [data.responsible] - Responsible user ID
   * @param {string} [data.notes] - Notes
   * @returns {Promise<Object>} Created activity
   */
  async createManagementActivity(data) {
    const response = await api.post('/management', data)
    return response.data.data
  },

  /**
   * Update a management activity
   * @param {string} id - Activity ID
   * @param {Object} data - Updated fields
   * @returns {Promise<Object>} Updated activity
   */
  async updateManagementActivity(id, data) {
    const response = await api.put(`/management/${id}`, data)
    return response.data.data
  },

  /**
   * Delete a management activity
   * @param {string} id - Activity ID
   * @returns {Promise<void>}
   */
  async deleteManagementActivity(id) {
    await api.delete(`/management/${id}`)
  },

  // ==========================================
  // Mitigation Plans (Tool 4)
  // ==========================================

  /**
   * Get all mitigation plans for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Array of mitigation plans
   */
  async getMitigationPlans(projectId) {
    try {
      const response = await api.get(`/mitigation/project/${projectId}`, {
        silent404: true, // Suppress console error for expected 404 (new project)
        validateStatus: (status) => status === 200 || status === 404, // Don't throw on 404
      })
      // 404 means no plans yet - return empty array
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
   * Create a mitigation plan
   * @param {Object} data - Plan data
   * @param {string} data.project - Project ID
   * @param {string} data.output_description - Output description (required)
   * @param {number} [data.serial_number] - Serial number
   * @param {string} [data.potential_impact_and_significance] - Impact description
   * @param {string} [data.mitigation_and_enhancement_measures] - Measures
   * @param {string} [data.monitoring] - Monitoring approach
   * @param {string} [data.schedule] - Schedule
   * @param {string} [data.responsible] - Responsible user ID
   * @param {string} [data.notes] - Notes
   * @returns {Promise<Object>} Created plan
   */
  async createMitigationPlan(data) {
    const response = await api.post('/mitigation', data)
    return response.data.data
  },

  /**
   * Update a mitigation plan
   * @param {string} id - Plan ID
   * @param {Object} data - Updated fields
   * @returns {Promise<Object>} Updated plan
   */
  async updateMitigationPlan(id, data) {
    const response = await api.put(`/mitigation/${id}`, data)
    return response.data.data
  },

  /**
   * Delete a mitigation plan
   * @param {string} id - Plan ID
   * @returns {Promise<void>}
   */
  async deleteMitigationPlan(id) {
    await api.delete(`/mitigation/${id}`)
  },
}

export default sempService
