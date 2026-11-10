/**
 * Help Service
 * The in-app user guide (phase 14, D78). The server returns only the parts and sections the
 * signed-in user's permissions allow; the frontend shows what it gets.
 */
import api from './api'

export const HELP_LANGUAGES = ['en', 'ar']

export const helpService = {
  /**
   * @param {'en'|'ar'} lang
   * @returns {Promise<{lang: string, parts: Array<{id: string, title: string, intro: string,
   *   sections: Array<{id: string, title: string, body: string}>}>}>}
   */
  async get(lang) {
    const response = await api.get('/help', { params: { lang } })
    return response.data.data
  },
}

export default helpService
