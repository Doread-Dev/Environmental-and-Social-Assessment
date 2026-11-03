/**
 * Monitoring Service
 * Monitoring records (Tool 5): load a project's records and save them in one request (D32)
 */
import api from './api'

/**
 * Monitoring Service Object
 */
export const monitoringService = {
  /**
   * Get all monitoring records for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Array of monitoring records ([] when none yet)
   */
  async getByProject(projectId) {
    const response = await api.get(`/monitoring/project/${projectId}`)
    return response.data.data
  },

  /**
   * Upsert records by indicator (one per indicator); records not sent stay as they are
   * @param {string} projectId - Project ID
   * @param {Array} records - Records with `indicator`, `scores`, `total`, `ranking`, …
   * @returns {Promise<Array>} All records of the project
   */
  async save(projectId, records) {
    const response = await api.put(`/projects/${projectId}/monitoring`, { records })
    return response.data.data
  },
}

export default monitoringService
