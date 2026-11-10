import { describe, expect, it } from 'vitest'
import {
  assessmentSubmitError,
  validateDates,
  validateProjectDescription,
  validatePassword,
  validateProjectTitle,
  validateScreeningForm,
} from './validators'

describe('validatePassword (login)', () => {
  it('only requires a value: the policy is checked by the backend when a password is set', () => {
    expect(validatePassword('')).toEqual({ valid: false, error: 'Password is required' })
    expect(validatePassword('abc')).toEqual({ valid: true, error: null })
  })
})

// D57: no minimum-length rules; required fields must still not be empty.
describe('no minimum lengths (D57)', () => {
  it('accepts a one-character screening', () => {
    const result = validateScreeningForm({
      screeningDate: '2026-01-01',
      categoryCode: 'B',
      categoryReason: 'x',
      potentialNegative: 'x',
      potentialPositive: 'x',
    })
    expect(result).toEqual({ valid: true, errors: {} })
  })

  it('still requires the screening fields', () => {
    const { valid, errors } = validateScreeningForm({ categoryReason: '   ' })
    expect(valid).toBe(false)
    expect(Object.keys(errors).sort()).toEqual([
      'categoryCode',
      'categoryReason',
      'potentialNegative',
      'potentialPositive',
      'screeningDate',
    ])
  })

  it('accepts one-character assessment metadata at submit', () => {
    const filled = {
      project_activity: 'x',
      description: 'x',
      environmental_setting: 'x',
      legal_requirements: 'x',
    }
    expect(assessmentSubmitError(filled)).toBeNull()
  })

  it('assessment submit names the missing metadata like the backend (D74 2)', () => {
    const filled = {
      project_activity: 'x',
      description: 'x',
      environmental_setting: 'x',
      legal_requirements: 'x',
    }
    expect(assessmentSubmitError({ ...filled, legal_requirements: ' ' })).toBe(
      'Fill in Legal requirements before submitting'
    )
    expect(
      assessmentSubmitError({ ...filled, environmental_setting: '', legal_requirements: '' })
    ).toBe('Fill in Environmental setting and Legal requirements before submitting')
    expect(assessmentSubmitError({})).toBe(
      'Fill in Project activity, Description, Environmental setting and Legal requirements before submitting'
    )
  })

  it('project dates: the same day is allowed, an end before the start is not (D74 1)', () => {
    expect(validateDates('2026-05-10', '2026-05-10')).toEqual({ valid: true, errors: {} })
    expect(validateDates('2026-05-10', '2026-05-09').errors).toEqual({
      endDate: 'End date cannot be before the start date',
    })
  })

  it('accepts a short project title and description', () => {
    expect(validateProjectTitle('AB').valid).toBe(true)
    expect(validateProjectDescription('Short').valid).toBe(true)
    expect(validateProjectTitle(' ').valid).toBe(false)
  })
})
