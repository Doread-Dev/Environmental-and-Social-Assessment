/**
 * تنسيق التاريخ
 * @param {string | Date} date
 * @param {Object} options
 * @returns {string}
 */
export function formatDate(date, options = {}) {
  if (!date) return ''

  const d = new Date(date)
  const defaultOptions = {
    month: 'short',
    year: 'numeric',
    ...options,
  }

  return d.toLocaleDateString('en-US', defaultOptions)
}

/**
 * حساب مدة المشروع بالأشهر
 * @param {string} startDate
 * @param {string} endDate
 * @returns {number}
 */
export function calculateDurationMonths(startDate, endDate) {
  if (!startDate || !endDate) return 0

  const start = new Date(startDate)
  const end = new Date(endDate)

  const months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())

  return Math.max(0, months)
}

/**
 * تنسيق نطاق التواريخ
 * @param {string} startDate
 * @param {string} endDate
 * @returns {string}
 */
export function formatDateRange(startDate, endDate) {
  const start = formatDate(startDate)
  const end = endDate ? formatDate(endDate) : 'Present'

  return `${start} - ${end}`
}

/**
 * تنسيق التاريخ بالصيغة الكاملة (1 January 2023)
 * @param {string | Date} date
 * @returns {string}
 */
export function formatDateFull(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * تنسيق التاريخ بصيغة مختصرة (Oct 24, 2023)
 * @param {string | Date} date
 * @returns {string}
 */
export function formatDateShort(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * تنسيق مدة المشروع
 * @param {number} months
 * @returns {string}
 */
export function formatDuration(months) {
  if (months === 1) return '1 Month'
  return `${months} Months`
}

/**
 * تقصير النص
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}
