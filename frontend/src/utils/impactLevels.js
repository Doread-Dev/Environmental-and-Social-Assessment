/**
 * Impact levels (static, not from the API): labels and colors for scoring and ranking UI
 */

export const IMPACT_LEVELS = {
  NEGLIGIBLE: 'negligible',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  NOT_APPLICABLE: 'not_applicable',
}

export const IMPACT_LEVEL_CONFIG = {
  [IMPACT_LEVELS.NEGLIGIBLE]: {
    label: 'Negligible',
    labelAr: 'مهمل',
    value: 0,
    color: 'gray',
    bgClass: 'bg-gray-50/50 dark:bg-white/5',
    textClass: 'text-gray-600 dark:text-gray-400',
    dotClass: 'bg-gray-400',
  },
  [IMPACT_LEVELS.LOW]: {
    label: 'Low',
    labelAr: 'منخفض',
    value: 1,
    color: 'green',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-400',
    dotClass: 'bg-primary',
  },
  [IMPACT_LEVELS.MEDIUM]: {
    label: 'Medium',
    labelAr: 'متوسط',
    value: 2,
    color: 'amber',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-700 dark:text-amber-400',
    dotClass: 'bg-amber-500',
  },
  [IMPACT_LEVELS.HIGH]: {
    label: 'High',
    labelAr: 'عالي',
    value: 3,
    color: 'red',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-400',
    dotClass: 'bg-red-500',
  },
  [IMPACT_LEVELS.NOT_APPLICABLE]: {
    label: 'N/A',
    labelAr: 'غير قابل للتطبيق',
    value: -1,
    color: 'gray',
    bgClass: 'bg-gray-50/50 dark:bg-white/5',
    textClass: 'text-gray-500 dark:text-gray-500',
    dotClass: 'bg-gray-300',
  },
}
