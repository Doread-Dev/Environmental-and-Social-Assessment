/**
 * Display formats of the app (D71): one date format everywhere on screen — "5 Nov 2026" — and
 * "5 Nov 2026, 14:30" where the time matters (activity log). Excel exports keep their own format
 * (utils/excelExport/excelBase.js).
 */

const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const toValidDate = (value) => {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * A date as "5 Nov 2026"; '' when empty or invalid.
 * @param {string | Date} date
 * @returns {string}
 */
export function formatDate(date) {
  const d = toValidDate(date)
  return d ? DATE_FORMAT.format(d) : ''
}

/**
 * A date and time as "5 Nov 2026, 14:30"; '' when empty or invalid.
 * @param {string | Date} date
 * @returns {string}
 */
export function formatDateTime(date) {
  const d = toValidDate(date)
  return d ? DATE_TIME_FORMAT.format(d) : ''
}

/**
 * A period as "5 Nov 2026 – 3 Mar 2027" (end missing → "Present"; both missing → '').
 * @param {string} startDate
 * @param {string} endDate
 * @returns {string}
 */
export function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return ''
  const start = formatDate(startDate) || 'Not specified'
  const end = formatDate(endDate) || 'Present'
  return `${start} – ${end}`
}

/**
 * Project duration in months
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
 * Formats a project duration
 * @param {number} months
 * @returns {string}
 */
export function formatDuration(months) {
  if (months === 1) return '1 Month'
  return `${months} Months`
}
/**
 * A date as the value of an <input type="date"> (local YYYY-MM-DD)
 * @param {Date} [date] - Today by default
 * @returns {string}
 */
export function toDateInputValue(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
