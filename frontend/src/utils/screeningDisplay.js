/**
 * Screening categories and status display
 * Moved from data/screeningCategories for production use (no mock dependency)
 */

export const screeningCategories = {
  A: {
    code: 'A',
    label: 'High Risk',
    labelAr: 'مخاطر عالية',
    description: 'Significant environmental or social impacts - requires full EIA',
    descriptionAr: 'مخاطر بيئية عالية، يحتاج تقييم أثر بيئي كامل',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-400',
    borderColor: 'border-red-200 dark:border-red-800',
    canProceed: true,
  },
  B: {
    code: 'B',
    label: 'Low-Moderate Risk',
    labelAr: 'مخاطر منخفضة-متوسطة',
    description: 'Low to moderate risks that can be mitigated',
    descriptionAr: 'مخاطر منخفضة-متوسطة، قابلة للتخفيف',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    textColor: 'text-yellow-700 dark:text-yellow-400',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    canProceed: true,
  },
  C: {
    code: 'C',
    label: 'Negligible Risk',
    labelAr: 'مخاطر شبه معدومة',
    description: 'Minimal to no environmental or social impacts',
    descriptionAr: 'مخاطر شبه معدومة',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-400',
    borderColor: 'border-green-200 dark:border-green-800',
    canProceed: true,
  },
  D: {
    code: 'D',
    label: 'Emergency',
    labelAr: 'حالات الطوارئ',
    description: 'Emergency response project with expedited process',
    descriptionAr: 'حالات الطوارئ - إجراءات مُسرّعة',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
    canProceed: true,
  },
  E: {
    code: 'E',
    label: 'Insufficient Info',
    labelAr: 'معلومات غير كافية',
    description: 'Cannot proceed - requires additional information gathering',
    descriptionAr: 'معلومات غير كافية - لا يمكن المتابعة',
    bgColor: 'bg-background dark:bg-white/5',
    textColor: 'text-text-main dark:text-gray-400',
    borderColor: 'border-border-default dark:border-border-dark',
    canProceed: true,
  },
  F: {
    code: 'F',
    label: 'Positive Impact',
    labelAr: 'أثر بيئي إيجابي',
    description: 'Net positive environmental or social impact',
    descriptionAr: 'أثر بيئي إيجابي صافي',
    bgColor: 'bg-risk-f-bg dark:bg-primary/20',
    textColor: 'text-risk-f-text dark:text-green-300',
    borderColor: 'border-primary-border dark:border-green-800',
    canProceed: true,
  },
}

/**
 * Get screening category info by code
 * @param {string} code - Category code
 * @returns {Object|null}
 */
export function getScreeningCategory(code) {
  return screeningCategories[code] || null
}
