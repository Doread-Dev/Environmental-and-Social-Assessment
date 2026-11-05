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
   * @returns {Promise<{rows: Array, version: number}>} The table ([] when none yet) and its
   *   revision (D62), sent back with the next save
   */
  async getManagementActivities(projectId) {
    const response = await api.get(`/management/project/${projectId}`)
    return { rows: response.data.data, version: response.data.version }
  },

  /**
   * Replace the project's whole Tool 3 table: rows with `_id` are updated, rows without one are
   * created, rows left out are deleted
   * @param {string} projectId - Project ID
   * @param {Array} rows - Table rows
   * @returns {Promise<{rows: Array, version: number}>} The saved table and its new revision
   */
  async saveManagementActivities(projectId, rows, version) {
    const response = await api.put(`/projects/${projectId}/management`, { version, rows })
    return { rows: response.data.data, version: response.data.version }
  },

  /**
   * Get all mitigation plans for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<{rows: Array, version: number}>} The table ([] when none yet) and its
   *   revision (D62), sent back with the next save
   */
  async getMitigationPlans(projectId) {
    const response = await api.get(`/mitigation/project/${projectId}`)
    return { rows: response.data.data, version: response.data.version }
  },

  /**
   * Replace the project's whole Tool 4 table (same rules as saveManagementActivities)
   * @param {string} projectId - Project ID
   * @param {Array} rows - Table rows
   * @returns {Promise<{rows: Array, version: number}>} The saved table and its new revision
   */
  async saveMitigationPlans(projectId, rows, version) {
    const response = await api.put(`/projects/${projectId}/mitigation`, { version, rows })
    return { rows: response.data.data, version: response.data.version }
  },
}

export default sempService
