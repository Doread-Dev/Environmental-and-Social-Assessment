/**
 * File Service
 * Project documents (D47, D64 d). The server checks type, size and roles; the client only
 * pre-checks with GET /auth/me upload_rules to fail early.
 */
import api from './api'

// Uploads and downloads can take longer than ordinary requests on a slow line.
export const FILE_TIMEOUT_MS = 5 * 60 * 1000

/**
 * A blob request's error body arrives as a Blob: turn it back into JSON so extractErrorMessage
 * can read the server's message.
 */
async function readBlobError(error) {
  const data = error.response?.data
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    try {
      error.response.data = JSON.parse(await data.text())
    } catch {
      // Not JSON: keep the generic message
    }
  }
  return error
}

/**
 * GET a file with the user's token (downloads are authenticated).
 * @param {string} url
 * @returns {Promise<Blob>}
 */
export async function getBlob(url) {
  try {
    const response = await api.get(url, { responseType: 'blob', timeout: FILE_TIMEOUT_MS })
    return response.data
  } catch (error) {
    throw await readBlobError(error)
  }
}

export const fileService = {
  /**
   * @param {string} projectId
   * @param {'documents'} [area]
   * @returns {Promise<Array>} files, oldest first
   */
  async list(projectId, area = 'documents') {
    const response = await api.get(`/projects/${projectId}/files`, { params: { area } })
    return response.data.data
  },

  /**
   * Upload one file.
   * @param {string} projectId
   * @param {{file: File, area: string, category: string}} data
   * @returns {Promise<Object>} the saved file row
   */
  async upload(projectId, { file, area, category }) {
    const form = new FormData()
    form.append('area', area)
    form.append('category', category)
    form.append('file', file)
    const response = await api.post(`/projects/${projectId}/files`, form, {
      // Overrides the JSON default; the browser then sets the multipart boundary itself.
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: FILE_TIMEOUT_MS,
    })
    return response.data.data
  },

  /**
   * @param {string} fileId
   * @returns {Promise<Blob>}
   */
  download(fileId) {
    return getBlob(`/files/${fileId}/download`)
  },

  /** @param {string} fileId */
  async remove(fileId) {
    await api.delete(`/files/${fileId}`)
  },
}

export default fileService
