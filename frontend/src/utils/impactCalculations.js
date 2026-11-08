/**
 * Impact Calculations Utilities
 * Shared impact calculations
 * The same rules as the backend (services/assessment.service.js recalculates the totals)
 */

/**
 * Priority levels (highest first)
 */
export const PRIORITY_LEVELS = ['high', 'medium', 'low', 'negligible', 'not_applicable']

/**
 * Total impact by priority
 *
 * Rule: if any question is high, the project is High impact,
 * however many there are
 *
 * @param {Object} totalScore - Count per level
 * @returns {string} - The highest level present
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
 * The highest impact level in one category
 *
 * @param {Array} scores - The scores
 * @param {Array} categoryQuestions - The category's questions
 * @returns {string} - The highest level in the category
 */
export function getCategoryHighestLevel(scores, categoryQuestions) {
  const categoryScore = {
    negligible: 0,
    low: 0,
    medium: 0,
    high: 0,
    not_applicable: 0,
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
 * The total score from the list of scores
 *
 * @param {Array} scores - The scores
 * @returns {Object} - Count per level
 */
export function calculateTotalScore(scores) {
  const total = {
    negligible: 0,
    low: 0,
    medium: 0,
    high: 0,
    not_applicable: 0,
  }

  if (!scores || !Array.isArray(scores)) {
    return total
  }

  scores.forEach((score) => {
    if (score.level && total[score.level] !== undefined) {
      total[score.level]++
    }
  })

  return total
}

/**
 * Tool 2 submit confirmation (D67 c): how many questions differ from the Negligible default
 * (D54). Submit is never blocked by it.
 * @param {string[]} questionIds - Every question
 * @param {Array<{question: string, level: string}>} scores
 * @returns {string} e.g. "You changed 7 of 50; the other 43 stay Negligible."
 */
export function changedQuestionsSummary(questionIds, scores) {
  const levels = new Map(scores.map((score) => [score.question, score.level]))
  const total = questionIds.length
  const changed = questionIds.filter(
    (id) => (levels.get(id) || 'negligible') !== 'negligible'
  ).length
  if (changed === 0)
    return `You changed none of the ${total} questions; all ${total} stay Negligible.`
  if (changed === total) return `You changed all ${total} questions; none stays Negligible.`
  return `You changed ${changed} of ${total}; the other ${total - changed} stay Negligible.`
}
