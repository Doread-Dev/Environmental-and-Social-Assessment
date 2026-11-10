/**
 * Library Service
 * The reference library (D64 b): organisation guidance (PDF), linked to places. Every role reads
 * and opens documents; managing them needs `manage_library` (the server checks).
 */
import api from './api'
import { FILE_TIMEOUT_MS, getBlob } from './fileService'

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' }, timeout: FILE_TIMEOUT_MS }

export const libraryService = {
  /**
   * @param {{place?: string|null}} [params] - only the documents linked to this place
   * @returns {Promise<Array>} ordered by `order`, then title
   */
  async list({ place } = {}) {
    const response = await api.get('/library', { params: place ? { place } : undefined })
    return response.data.data
  },

  /**
   * @param {{file: File, title: string, description?: string, places: string[], order?: number}} data
   */
  async create({ file, title, description = '', places = [], order = 0 }) {
    const form = new FormData()
    form.append('title', title)
    form.append('description', description)
    form.append('places', places.join(','))
    form.append('order', String(order))
    form.append('file', file)
    const response = await api.post('/library', form, MULTIPART)
    return response.data.data
  },

  /**
   * Title, description, places, order — the file stays.
   * @param {string} id
   * @param {{title?: string, description?: string, places?: string[], order?: number}} data
   */
  async update(id, data) {
    const response = await api.patch(`/library/${id}`, data)
    return response.data.data
  },

  /**
   * A new PDF for the same document (title and links kept).
   * @param {string} id
   * @param {File} file
   */
  async replaceFile(id, file) {
    const form = new FormData()
    form.append('file', file)
    const response = await api.put(`/library/${id}/file`, form, MULTIPART)
    return response.data.data
  },

  /** @param {string} id */
  async remove(id) {
    await api.delete(`/library/${id}`)
  },

  /**
   * @param {string} id
   * @returns {Promise<Blob>} the PDF
   */
  download(id) {
    return getBlob(`/library/${id}/file`)
  },
}

export default libraryService
