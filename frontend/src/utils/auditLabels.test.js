import { describe, expect, it } from 'vitest'
import {
  AUDIT_ACTION_FILTER_GROUPS,
  AUDIT_ACTION_LABELS,
  auditActionLabel,
  auditActionVariant,
  describeAuditEntry,
} from './auditLabels'

// The actions the backend logs (backend/src/models/auditLog.model.js, D65).
const BACKEND_ACTIONS = [
  'project.delete',
  'project.purge',
  'project.archive',
  'project.restore',
  'file.delete',
  'management.rows_removed',
  'mitigation.rows_removed',
  'user.create',
  'user.role_change',
  'user.deactivate',
  'user.reactivate',
  'user.reset_password',
]

describe('auditLabels (D65)', () => {
  it('has a label for every logged action, and the filter offers each one', () => {
    expect(Object.keys(AUDIT_ACTION_LABELS).sort()).toEqual([...BACKEND_ACTIONS].sort())
    const offered = AUDIT_ACTION_FILTER_GROUPS.flatMap((g) => g.options.map((o) => o.value))
    expect(offered.sort()).toEqual([...BACKEND_ACTIONS].sort())
  })

  it('falls back to the raw name for an unknown action', () => {
    expect(auditActionLabel('library.delete')).toBe('library.delete')
  })

  it('colours removals red, project state amber, user changes blue', () => {
    expect(auditActionVariant('project.purge')).toBe('error')
    expect(auditActionVariant('file.delete')).toBe('error')
    expect(auditActionVariant('mitigation.rows_removed')).toBe('error')
    expect(auditActionVariant('project.archive')).toBe('warning')
    expect(auditActionVariant('user.reset_password')).toBe('info')
  })

  it('describes a project snapshot with readable values and no ids', () => {
    const { fields, rows } = describeAuditEntry({
      snapshot: {
        title: 'Wells',
        location: 'Aleppo',
        archived: true,
        archived_by: '64b0',
        archived_by_name: 'Sara',
        screening_status: 'approved',
        screening_category: 'B',
        assessment_status: null,
        total_project_impact: 'high',
        rows: { management_activities: 2, mitigation_plans: 1, monitoring_records: 0 },
        files: 3,
      },
    })
    expect(Object.fromEntries(fields.map((f) => [f.label, f.value]))).toEqual({
      Title: 'Wells',
      Location: 'Aleppo',
      Screening: 'Approved',
      'Screening category': 'Category B',
      'Total impact': 'High',
      Rows: '2 management activities, 1 mitigation plan rows, 0 monitoring records',
      Files: '3',
      Archived: 'Yes',
      'Archived by': 'Sara',
    })
    expect(rows).toEqual([])
  })

  it('describes a deleted file', () => {
    const { fields } = describeAuditEntry({
      snapshot: { name: 'Permit.pdf', area: 'annex', category: 'annex_a', size: 2048 },
    })
    expect(fields).toEqual([
      { label: 'Name', value: 'Permit.pdf' },
      { label: 'Area', value: 'Annex' },
      { label: 'Category', value: 'Annex A — Environmental Policy' },
      { label: 'Size', value: '2 KB' },
    ])
  })

  it('lists removed rows separately', () => {
    const { fields, rows } = describeAuditEntry({
      snapshot: { rows: [{ _id: 'r1', serial_number: 4, description: '' }] },
      details: { removed: 1 },
    })
    expect(fields).toEqual([{ label: 'Rows removed', value: '1' }])
    expect(rows).toEqual([{ key: 'r1', serial: 4, description: '—' }])
  })

  it('copes with an entry without snapshot or details', () => {
    expect(describeAuditEntry({ snapshot: null, details: null })).toEqual({ fields: [], rows: [] })
  })
})
