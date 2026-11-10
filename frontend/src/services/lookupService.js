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
   * All lookup data in one call (D31), with the places registry (D64 a)
   * @returns {Promise<{impactCategories: Array, impactQuestions: Array, indicators: Array, jobTitles: Array, places: Array, placeGroups: Array}>}
   */
  async getAll() {
    const response = await api.get('/lookups')
    const { impact_categories, impact_questions, indicators, job_titles, places, place_groups } =
      response.data.data
    return {
      impactCategories: impact_categories,
      impactQuestions: impact_questions,
      indicators,
      jobTitles: job_titles,
      places: places ?? [],
      placeGroups: place_groups ?? [],
    }
  },
}

export default lookupService
