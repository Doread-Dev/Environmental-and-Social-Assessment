import { describe, expect, it } from 'vitest'
import { formatDate, formatDateRange, formatDateTime } from './formatters'
import { getReviewer, positionOf } from './reviewer'
import { getStatusBadge, getStatusBarColor } from './statusBadges'

describe('one date format (D71)', () => {
  it('formatDate: "5 Nov 2026"; empty or invalid → ""', () => {
    expect(formatDate('2026-11-05T10:00:00.000Z')).toBe('5 Nov 2026')
    expect(formatDate(new Date(2026, 0, 15))).toBe('15 Jan 2026')
    expect(formatDate(null)).toBe('')
    expect(formatDate('not a date')).toBe('')
  })

  it('formatDateTime: date and 24-hour time', () => {
    const value = new Date(2026, 10, 3, 14, 5)
    expect(formatDateTime(value)).toBe('3 Nov 2026, 14:05')
    expect(formatDateTime(undefined)).toBe('')
  })

  it('formatDateRange: start – end; open end reads "Present"; nothing → ""', () => {
    expect(formatDateRange(new Date(2026, 0, 15), new Date(2026, 11, 31))).toBe(
      '15 Jan 2026 – 31 Dec 2026'
    )
    expect(formatDateRange(new Date(2026, 0, 15), null)).toBe('15 Jan 2026 – Present')
    expect(formatDateRange(null, null)).toBe('')
  })
})

describe('reviewer for "Approved By" / "Position" (D16)', () => {
  const approver = { name: 'Lina Haddad', role: 'environmental_specialist', job_title: null }

  it('uses the populated approved_by first', () => {
    const record = {
      approved_by: { name: 'Omar', role: 'admin', job_title: { title_name: 'E&S Lead' } },
      status_history: [{ status: 'approved', by: approver, at: '2026-11-02T08:00:00Z' }],
    }
    expect(getReviewer(record, 'approved')).toEqual({
      name: 'Omar',
      position: 'E&S Lead',
      at: '2026-11-02T08:00:00Z',
    })
  })

  it('falls back to the last matching status_history entry when approved_by is only an id', () => {
    const record = {
      approved_by: '64f000000000000000000001',
      status_history: [
        { status: 'created', by: { name: 'A', role: 'viewer' } },
        { status: 'approved', by: { name: 'Old', role: 'admin' } },
        { status: 'approved', by: approver, at: '2026-11-04T09:00:00Z' },
      ],
    }
    expect(getReviewer(record, 'approved')).toEqual({
      name: 'Lina Haddad',
      position: 'Environmental Specialist',
      at: '2026-11-04T09:00:00Z',
    })
  })

  it('reads the rejecter the same way; nothing known → null', () => {
    const record = { status_history: [{ status: 'rejected', by: approver, note: 'x' }] }
    expect(getReviewer(record, 'rejected').name).toBe('Lina Haddad')
    expect(getReviewer({ status_history: [] }, 'approved')).toBeNull()
    expect(getReviewer(null)).toBeNull()
  })

  it('positionOf: job title, else role label, else ""', () => {
    expect(positionOf({ job_title: { title_name: 'Engineer' }, role: 'viewer' })).toBe('Engineer')
    expect(positionOf({ role: 'program_manager' })).toBe('Program Manager')
    expect(positionOf(undefined)).toBe('')
  })
})

describe('status badges', () => {
  it('maps every status family to one label and variant', () => {
    expect(getStatusBadge('approved')).toMatchObject({ label: 'Approved', variant: 'success' })
    expect(getStatusBadge('monitoring')).toMatchObject({ variant: 'primary' })
    expect(getStatusBadge('archived')).toMatchObject({ label: 'Archived', icon: 'inventory_2' })
    expect(getStatusBadge(undefined).label).toBe('Not Started')
  })

  it('progress bars use the badge colour family', () => {
    expect(getStatusBarColor('approved')).toBe('bg-primary')
    expect(getStatusBarColor('submitted')).toBe('bg-amber-500')
    expect(getStatusBarColor('locked')).toContain('bg-border-default')
  })
})
