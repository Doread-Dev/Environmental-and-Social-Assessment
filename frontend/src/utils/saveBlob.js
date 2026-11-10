/**
 * Save a Blob under the given name through a temporary link (downloads are fetched with the
 * token, so a plain <a href> to the API would not be signed in).
 * @param {Blob} blob
 * @param {string} name
 */
export function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** @param {{mime_type?: string}} file */
export const isPdf = (file) => file?.mime_type === 'application/pdf'

/** Whether this browser can show a PDF in a frame (unknown = assume yes; PdfViewer). */
export const canShowPdfInline = () =>
  typeof navigator === 'undefined' || navigator.pdfViewerEnabled !== false
