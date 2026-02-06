/**
 * Assessment Service
 * Handles assessment CRUD and sub-entities
 */
import api from './api'

export const assessmentService = {
  /**
   * Get all assessments
   * @returns {Promise<Array>}
   */
  async getAll() {
    const response = await api.get('/assessments')
    return response.data.data
  },

  /**
   * Get assessment by ID
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async getById(id) {
    const response = await api.get(`/assessments/${id}`)
    return response.data.data
  },

  /**
   * Get assessment by project ID
   * @param {string} projectId
   * @returns {Promise<Object>}
   */
  async getByProjectId(projectId) {
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
   * Replace all methods for an assessment
   * @param {string} assessmentId
   * @param {Array} methods
   * @returns {Promise<Array>}
   */
  async setMethods(assessmentId, methods) {
    const response = await api.put(`/assessments/${assessmentId}/methods`, methods)
    return response.data.data
  },

  /**
   * Get all methods for an assessment
   * @param {string} assessmentId
   * @returns {Promise<Array>}
   */
  async getMethods(assessmentId) {
    const response = await api.get(`/assessments/${assessmentId}/methods`)
    return response.data.data
  },

  /**
   * Replace all consultations for an assessment
   * @param {string} assessmentId
   * @param {Array} consultations
   * @returns {Promise<Array>}
   */
  async setConsultations(assessmentId, consultations) {
    const response = await api.put(`/assessments/${assessmentId}/consultations`, consultations)
    return response.data.data
  },

  /**
   * Get all consultations for an assessment
   * @param {string} assessmentId
   * @returns {Promise<Array>}
   */
  async getConsultations(assessmentId) {
    const response = await api.get(`/assessments/${assessmentId}/consultations`)
    return response.data.data
  },

  /**
   * Replace all impact scores for an assessment
   * @param {string} assessmentId
   * @param {Array} scores
   * @returns {Promise<Array>}
   */
  async addScores(assessmentId, scores) {
    const response = await api.post(`/assessments/${assessmentId}/scores`, scores)
    return response.data.data
  },

  /**
   * Get all impact scores for an assessment
   * @param {string} assessmentId
   * @returns {Promise<Array>}
   */
  async getScores(assessmentId) {
    const response = await api.get(`/assessments/${assessmentId}/scores`)
    return response.data.data
  },

  /**
   * Calculate total impact for an assessment
   * @param {string} assessmentId
   * @returns {Promise<Object>}
   */
  async calculate(assessmentId) {
    const response = await api.patch(`/assessments/${assessmentId}/calculate`)
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
