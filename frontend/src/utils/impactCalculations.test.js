import { describe, expect, it } from 'vitest'
import { changedQuestionsSummary } from './impactCalculations'

const ids = Array.from({ length: 50 }, (_, i) => `q${i + 1}`)
const scores = (changed) =>
  ids.map((question, i) => ({ question, level: i < changed ? 'medium' : 'negligible' }))

describe('changedQuestionsSummary (D67 c)', () => {
  it('counts the questions that differ from Negligible', () => {
    expect(changedQuestionsSummary(ids, scores(7))).toBe(
      'You changed 7 of 50; the other 43 stay Negligible.'
    )
  })

  it('a question without a score counts as Negligible (D54 default)', () => {
    expect(changedQuestionsSummary(ids, scores(7).slice(0, 10))).toBe(
      'You changed 7 of 50; the other 43 stay Negligible.'
    )
  })

  it('none and all', () => {
    expect(changedQuestionsSummary(ids, scores(0))).toBe(
      'You changed none of the 50 questions; all 50 stay Negligible.'
    )
    expect(changedQuestionsSummary(ids, scores(50))).toBe(
      'You changed all 50 questions; none stays Negligible.'
    )
  })

  it('Not Applicable counts as changed', () => {
    const list = scores(0)
    list[3] = { question: 'q4', level: 'not_applicable' }
    expect(changedQuestionsSummary(ids, list)).toMatch(/^You changed 1 of 50/)
  })
})
