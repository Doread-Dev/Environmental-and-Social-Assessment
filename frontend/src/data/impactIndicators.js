/**
 * Impact Indicators for Annual Monitoring
 * Deprecated: use useLookups() for live data
 */

/**
 * @deprecated Use useLookups().indicators instead
 */
export const impactIndicators = []

/**
 * @deprecated Use useLookups().getIndicatorsByCategory() instead
 */
export function getIndicatorsByCategory() {
  console.warn('getIndicatorsByCategory is deprecated. Use useLookups() hook instead.')
  return []
}

/**
 * @deprecated Use useLookups().getTotalIndicatorCount instead
 */
export function getTotalIndicatorCount() {
  console.warn('getTotalIndicatorCount is deprecated. Use useLookups() hook instead.')
  return 24
}
