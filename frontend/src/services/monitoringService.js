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
   * @returns {Promise<{records: Array, version: number}>} The records ([] when none yet) and
   *   the table revision (D62), sent back with the next save
   */
  async getByProject(projectId) {
    const response = await api.get(`/monitoring/project/${projectId}`)
    return { records: response.data.data, version: response.data.version }
  },

  /**
   * Upsert records by indicator (one per indicator); records not sent stay as they are
   * @param {string} projectId - Project ID
   * @param {Array} records - Records with `indicator`, `scores`, `total`, `ranking`, …
   * @returns {Promise<{records: Array, version: number}>} All records and the new revision
   */
  async save(projectId, records, version) {
    const response = await api.put(`/projects/${projectId}/monitoring`, { version, records })
    return { records: response.data.data, version: response.data.version }
  },
}

export default monitoringService
