/**
 * Lookup Service
 * Fetches static/reference data from the backend
 */
import api from './api'

/**
 * Lookup Service Object
 */
export const lookupService = {
  /**
   * Get all impact categories
   * @returns {Promise<Array>} Array of impact categories
   */
  async getImpactCategories() {
    const response = await api.get('/lookups/impact-categories')
    return response.data.data
  },

  /**
   * Get all impact questions with category populated
   * @returns {Promise<Array>} Array of impact questions
   */
  async getImpactQuestions() {
    const response = await api.get('/lookups/impact-questions')
    return response.data.data
  },

  /**
   * Get all monitoring indicators with category populated
   * @returns {Promise<Array>} Array of indicators
   */
  async getIndicators() {
    const response = await api.get('/lookups/indicators')
    return response.data.data
  },

  /**
   * Get all job titles
   * @returns {Promise<Array>} Array of job titles
   */
  async getJobTitles() {
    const response = await api.get('/lookups/job-titles')
    return response.data.data
  },

  /**
   * Fetch all lookup data in parallel
   * @returns {Promise<Object>} Object containing all lookup data
   */
  async getAllLookups() {
    const [impactCategories, impactQuestions, indicators, jobTitles] = await Promise.all([
      this.getImpactCategories(),
      this.getImpactQuestions(),
      this.getIndicators(),
      this.getJobTitles(),
    ])

    return {
      impactCategories,
      impactQuestions,
      indicators,
      jobTitles,
    }
  },
}

export default lookupService
