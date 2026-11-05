import { describe, expect, it } from 'vitest'
import {
  extractId,
  extractUserJobTitle,
  extractUserName,
  formatDate,
  formatRecommendedActions,
  hasArabic,
  lastStatusDate,
  responsibleText,
  rowHeight,
  safeString,
  textAlignment,
} from './excelBase'

describe('excelBase helpers', () => {
  it('reads users the way the app shows them', () => {
    expect(extractUserName({ name: 'Rana' })).toBe('Rana')
    expect(extractUserName({ name: 'Omar', is_active: false })).toBe('Omar (inactive)')
    expect(extractUserName('u1')).toBe('')
    expect(extractUserJobTitle({ job_title: { title_name: 'Engineer' } })).toBe('Engineer')
    expect(extractUserJobTitle({ job_title: 'Officer' })).toBe('Officer')
    expect(extractUserJobTitle({ role: 'viewer' })).toBe('Viewer')
    expect(extractUserJobTitle({})).toBe('')
    expect(extractUserJobTitle(null)).toBe('')
  })

  it('responsible: user first, else the external party, else nothing (D55)', () => {
    expect(responsibleText({ responsible: { name: 'Rana' }, responsible_text: 'X' })).toBe('Rana')
    expect(responsibleText({ responsible: null, responsible_text: ' Council ' })).toBe(
      'Council (external party)'
    )
    expect(responsibleText({ responsible: 'u1', responsible_text: '' })).toBe('')
    expect(responsibleText(null)).toBe('')
  })

  it('small formatters', () => {
    expect(formatRecommendedActions(['a', '', 'b'])).toBe('a\nb')
    expect(formatRecommendedActions('one')).toBe('one')
    expect(formatRecommendedActions(null)).toBe('')
    expect(formatDate('not a date')).toBe('')
    expect(formatDate(null)).toBe('')
    expect(extractId({ _id: 'x' })).toBe('x')
    expect(extractId('y')).toBe('y')
    expect(extractId(5)).toBeNull()
    expect(safeString(undefined, '-')).toBe('-')
    expect(rowHeight('', 10)).toBe(15)
    expect(rowHeight('x'.repeat(5000), 10)).toBe(300)
  })

  it('Arabic text reads right to left', () => {
    expect(hasArabic('مرحبا')).toBe(true)
    expect(hasArabic('hello')).toBe(false)
    expect(textAlignment('مرحبا')).toMatchObject({ readingOrder: 'rtl', horizontal: 'right' })
    expect(textAlignment('hello', { horizontal: 'center' })).toEqual({
      vertical: 'top',
      wrapText: true,
      horizontal: 'center',
    })
  })

  it('the latest status_history date of a status', () => {
    const record = {
      status_history: [
        { status: 'submitted', at: '2026-01-01T10:00:00Z' },
        { status: 'rejected', at: '2026-01-02T10:00:00Z' },
        { status: 'submitted', at: '2026-01-05T10:00:00Z' },
      ],
    }
    expect(lastStatusDate(record, 'submitted')).toBe('January 5, 2026')
    expect(lastStatusDate(record, 'approved')).toBe('')
    expect(lastStatusDate(null, 'approved')).toBe('')
  })
})
