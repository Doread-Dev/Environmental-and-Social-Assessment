/**
 * Impact Categories (Tool 2) - بيانات فئات التأثير الأساسية
 * متوافق مع backend/src/models/impactCategory.model.js
 * هذه البيانات تُحمّل من API في الإنتاج
 *
 * ⚠️ ملاحظة: هذا الملف يحتوي على فئات التأثير بدون الأسئلة
 * للفئات مع الأسئلة التفصيلية، استخدم: @/data/impactQuestions.js
 *
 * الاستخدام:
 * - impactCategories.js: للعرض العام (Overview, Dashboard, SEMP)
 * - impactQuestions.js: للتقييم التفصيلي (Assessment Scoring)
 */
export const impactCategories = [
  {
    _id: '507f1f77bcf86cd799439201',
    code: 'A',
    name: 'Air Quality',
    name_ar: 'جودة الهواء',
  },
  {
    _id: '507f1f77bcf86cd799439202',
    code: 'B',
    name: 'Water Quality',
    name_ar: 'جودة المياه',
  },
  {
    _id: '507f1f77bcf86cd799439203',
    code: 'C',
    name: 'Noise',
    name_ar: 'الضجيج',
  },
  {
    _id: '507f1f77bcf86cd799439204',
    code: 'D',
    name: 'Solid Waste',
    name_ar: 'النفايات الصلبة',
  },
  {
    _id: '507f1f77bcf86cd799439205',
    code: 'E',
    name: 'Radiation',
    name_ar: 'الإشعاع',
  },
  {
    _id: '507f1f77bcf86cd799439206',
    code: 'F',
    name: 'Toxic & Dangerous Materials',
    name_ar: 'المواد الخطرة',
  },
  {
    _id: '507f1f77bcf86cd799439207',
    code: 'J',
    name: 'Plants, Forests & Wildlife',
    name_ar: 'النباتات والحياة البرية',
  },
  {
    _id: '507f1f77bcf86cd799439208',
    code: 'H',
    name: 'Land Use & Social Impacts',
    name_ar: 'استخدام الأرض والمجتمع',
  },
]

/**
 * Impact Levels (للتقييم في Tool 2)
 * متوافق مع backend/src/models/assessmentImpactScore.model.js
 */
export const impactLevels = {
  negligible: {
    key: 'negligible',
    label: 'Negligible',
    labelAr: 'مهمل',
    value: 0,
    color: 'bg-gray-100 text-gray-700',
  },
  low: {
    key: 'low',
    label: 'Low',
    labelAr: 'منخفض',
    value: 1,
    color: 'bg-green-100 text-green-700',
  },
  medium: {
    key: 'medium',
    label: 'Medium',
    labelAr: 'متوسط',
    value: 2,
    color: 'bg-yellow-100 text-yellow-700',
  },
  high: {
    key: 'high',
    label: 'High',
    labelAr: 'عالي',
    value: 3,
    color: 'bg-red-100 text-red-700',
  },
  not_applicable: {
    key: 'not_applicable',
    label: 'N/A',
    labelAr: 'غير قابل للتطبيق',
    value: -1,
    color: 'bg-gray-50 text-gray-500',
  },
}
