import { describe, expect, it } from 'vitest'
import {
  validateAssessmentMetadata,
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

  it('accepts one-character assessment metadata, still requires every field', () => {
    const filled = {
      project_activity: 'x',
      description: 'x',
      environmental_setting: 'x',
      legal_requirements: 'x',
    }
    expect(validateAssessmentMetadata(filled).valid).toBe(true)
    expect(validateAssessmentMetadata({ ...filled, description: ' ' }).errors).toEqual({
      description: 'Description is required',
    })
  })

  it('accepts a short project title and description', () => {
    expect(validateProjectTitle('AB').valid).toBe(true)
    expect(validateProjectDescription('Short').valid).toBe(true)
    expect(validateProjectTitle(' ').valid).toBe(false)
  })
})
