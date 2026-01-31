/**
 * Impact Calculations Utilities
 * دوال حساب التأثير الموحدة
 * ⚠️ متوافقة مع backend/documents/editPlan3.md
 */

/**
 * Priority Levels (من الأعلى إلى الأدنى)
 */
export const PRIORITY_LEVELS = ['high', 'medium', 'low', 'negligible', 'not_applicable']

/**
 * حساب التأثير الإجمالي باستخدام خوارزمية الأولوية
 * 
 * القاعدة: إذا وُجد أي سؤال بمستوى high، يعتبر المشروع High impact
 * بغض النظر عن العدد
 * 
 * @param {Object} totalScore - كائن يحتوي على عدد كل مستوى
 * @returns {string} - أعلى مستوى موجود
 * 
 * @example
 * calculateTotalImpact({ high: 3, medium: 15, low: 20, negligible: 10, not_applicable: 2 })
 * // returns 'high'
 */
export function calculateTotalImpact(totalScore) {
  if (!totalScore) return 'negligible'
  
  for (const level of PRIORITY_LEVELS) {
    if (totalScore[level] > 0) {
      return level
    }
  }
  
  return 'negligible'
}

/**
 * حساب أعلى مستوى تأثير في فئة معينة
 * 
 * @param {Array} scores - قائمة النتائج
 * @param {Array} categoryQuestions - أسئلة الفئة
 * @returns {string} - أعلى مستوى موجود في الفئة
 */
export function getCategoryHighestLevel(scores, categoryQuestions) {
  const categoryScore = {
    negligible: 0,
    low: 0,
    medium: 0,
    high: 0,
    not_applicable: 0
  }

  if (!categoryQuestions || !Array.isArray(categoryQuestions)) {
    return 'not_applicable'
  }

  categoryQuestions.forEach((q) => {
    const questionScore = scores.find((s) => s.question === q.id)
    if (questionScore?.level && categoryScore[questionScore.level] !== undefined) {
      categoryScore[questionScore.level]++
    }
  })

  return calculateTotalImpact(categoryScore)
}

/**
 * حساب النتيجة الإجمالية من قائمة النتائج
 * 
 * @param {Array} scores - قائمة النتائج
 * @returns {Object} - كائن يحتوي على عدد كل مستوى
 */
export function calculateTotalScore(scores) {
  const total = {
    negligible: 0,
    low: 0,
    medium: 0,
    high: 0,
    not_applicable: 0
  }

  if (!scores || !Array.isArray(scores)) {
    return total
  }

  scores.forEach(score => {
    if (score.level && total[score.level] !== undefined) {
      total[score.level]++
    }
  })

  return total
}
