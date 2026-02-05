/**
 * Category Icon Configuration
 * Maps impact category codes to their visual representation
 */

export const CATEGORY_ICONS = {
  A: {
    icon: 'air',
    iconColor: 'text-sky-500',
    iconBg: 'bg-sky-500/10',
  },
  B: {
    icon: 'water_drop',
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-500/10',
  },
  C: {
    icon: 'volume_up',
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-500/10',
  },
  D: {
    icon: 'delete',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-500/10',
  },
  E: {
    icon: 'radio_button_checked',
    iconColor: 'text-yellow-500',
    iconBg: 'bg-yellow-500/10',
  },
  F: {
    icon: 'warning',
    iconColor: 'text-red-600',
    iconBg: 'bg-red-600/10',
  },
  J: {
    icon: 'forest',
    iconColor: 'text-green-600',
    iconBg: 'bg-green-600/10',
  },
  H: {
    icon: 'landscape',
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-600/10',
  },
}

/**
 * Get icon config for a category code
 * @param {string} code - Category code (A-H, J)
 * @returns {Object} Icon configuration
 */
export function getCategoryIcon(code) {
  return CATEGORY_ICONS[code] || { icon: 'help', iconColor: 'text-gray-500', iconBg: 'bg-gray-500/10' }
}

export default CATEGORY_ICONS
