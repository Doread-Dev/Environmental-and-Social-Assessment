/**
 * SEMP Service
 * Management Activities (Tool 3) and Mitigation Plans (Tool 4): load a project's table and save
 * the whole table in one request (D32)
 */
import api from './api'

/**
 * SEMP Service Object
 */
export const sempService = {
  /**
   * Get all management activities for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Array of management activities ([] when none yet)
   */
  async getManagementActivities(projectId) {
    const response = await api.get(`/management/project/${projectId}`)
    return response.data.data
  },

  /**
   * Replace the project's whole Tool 3 table: rows with `_id` are updated, rows without one are
   * created, rows left out are deleted
   * @param {string} projectId - Project ID
   * @param {Array} rows - Table rows
   * @returns {Promise<Array>} The saved table
   */
  async saveManagementActivities(projectId, rows) {
    const response = await api.put(`/projects/${projectId}/management`, { rows })
    return response.data.data
  },

  /**
   * Get all mitigation plans for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Array of mitigation plans ([] when none yet)
   */
  async getMitigationPlans(projectId) {
    const response = await api.get(`/mitigation/project/${projectId}`)
    return response.data.data
  },

  /**
   * Replace the project's whole Tool 4 table (same rules as saveManagementActivities)
   * @param {string} projectId - Project ID
   * @param {Array} rows - Table rows
   * @returns {Promise<Array>} The saved table
   */
  async saveMitigationPlans(projectId, rows) {
    const response = await api.put(`/projects/${projectId}/mitigation`, { rows })
    return response.data.data
  },
}

export default sempService
