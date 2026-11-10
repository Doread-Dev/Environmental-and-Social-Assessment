/**
 * Assessment Service
 * Handles assessment CRUD and sub-entities
 */
import api from './api'

export const assessmentService = {
  /**
   * Get assessment by project ID
   * @param {string} projectId
   * @returns {Promise<Object|null>} Assessment with `methods`, `consultations` and `scores`
   *   embedded (D63 c), or null when not started yet
   */
  async getByProject(projectId) {
    const response = await api.get(`/assessments/project/${projectId}`)
    return response.data.data
  },

  /**
   * Create a new assessment
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    const response = await api.post('/assessments', data)
    return response.data.data
  },

  /**
   * Update an assessment
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    const response = await api.put(`/assessments/${id}`, data)
    return response.data.data
  },

  /**
   * Replace all methods for an assessment (bulk operation)
   * @param {string} assessmentId
   * @param {Array} methods
   * @param {string} version - The assessment's `updatedAt` the user saw (D62)
   * @returns {Promise<Object>} The assessment with methods, consultations and scores
   */
  async setMethods(assessmentId, methods, version) {
    const response = await api.put(`/assessments/${assessmentId}/methods`, { version, methods })
    return response.data.data
  },

  /**
   * Replace all consultations for an assessment (bulk operation)
   * @param {string} assessmentId
   * @param {Array} consultations
   * @param {string} version - The assessment's `updatedAt` the user saw (D62)
   * @returns {Promise<Object>} The assessment with methods, consultations and scores
   */
  async setConsultations(assessmentId, consultations, version) {
    const response = await api.put(`/assessments/${assessmentId}/consultations`, {
      version,
      consultations,
    })
    return response.data.data
  },

  /**
   * Set the level of the questions sent (others keep theirs); the backend recalculates the
   * total impact
   * @param {string} assessmentId
   * @param {Array} scores
   * @param {string} version - The assessment's `updatedAt` the user saw (D62)
   * @returns {Promise<Object>} The assessment with methods, consultations and all scores
   */
  async addScores(assessmentId, scores, version) {
    const response = await api.post(`/assessments/${assessmentId}/scores`, { version, scores })
    return response.data.data
  },

  /**
   * Submit an assessment for approval (draft|rejected → submitted)
   * @param {string} assessmentId
   * @param {string} version - The assessment's `updatedAt` the user saw (D62)
   * @returns {Promise<Object>}
   */
  async submit(assessmentId, version) {
    const response = await api.patch(`/assessments/${assessmentId}/submit`, { version })
    return response.data.data
  },

  /**
   * Approve assessment
   * @param {string} assessmentId
   * @param {string|null} recommendations
   * @returns {Promise<Object>}
   */
  async approve(assessmentId, recommendations) {
    const response = await api.patch(`/assessments/${assessmentId}/approve`, { recommendations })
    return response.data.data
  },

  /**
   * Reject assessment
   * @param {string} assessmentId
   * @param {string|null} rejectReason
   * @returns {Promise<Object>}
   */
  async reject(assessmentId, rejectReason) {
    const response = await api.patch(`/assessments/${assessmentId}/reject`, {
      reject_reason: rejectReason,
    })
    return response.data.data
  },
}

export default assessmentService
