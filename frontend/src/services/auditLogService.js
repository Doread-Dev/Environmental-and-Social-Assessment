/**
 * Audit Log Service
 * The critical-actions log (D65), admin only. Read only: entries are written by the backend.
 */
import api from './api'

export const auditLogService = {
  /**
   * One page of entries, newest first
   * @param {{page?: number, limit?: number, action?: string}} [params] - `action`: an action
   *   ("project.purge") or a prefix ("user.")
   * @returns {Promise<{items: Array, pagination: {page, limit, total, pages}}>}
   */
  async list({ page = 1, limit = 20, action } = {}) {
    const params = { page, limit, ...(action && { action }) }
    const response = await api.get('/audit-logs', { params })
    return { items: response.data.data, pagination: response.data.pagination }
  },
}

export default auditLogService
