/**
 * Project Service
 * Handles project CRUD operations
 */
import api from './api'

/**
 * Project Service Object
 */
export const projectService = {
  /**
   * Get all projects
   * @returns {Promise<Array>} Array of projects
   */
  async getAll() {
    const response = await api.get('/projects')
    return response.data.data
  },

  /**
   * Get a single project by ID
   * @param {string} id - Project ID
   * @returns {Promise<Object>} Project object
   */
  async getById(id) {
    const response = await api.get(`/projects/${id}`)
    return response.data.data
  },

  /**
   * Create a new project
   * @param {Object} data - Project data
   * @returns {Promise<Object>} Created project
   */
  async create(data) {
    const response = await api.post('/projects', data)
    return response.data.data
  },

  /**
   * Update an existing project
   * @param {string} id - Project ID
   * @param {Object} data - Updated project data
   * @returns {Promise<Object>} Updated project
   */
  async update(id, data) {
    const response = await api.put(`/projects/${id}`, data)
    return response.data.data
  },

  /**
   * Delete a project
   * @param {string} id - Project ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    await api.delete(`/projects/${id}`)
  },
}

export default projectService
