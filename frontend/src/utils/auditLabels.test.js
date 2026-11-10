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
  'library.replace_file',
  'library.delete',
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
    expect(auditActionLabel('library.rename')).toBe('library.rename')
  })

  it('colours removals red, project state amber, user changes blue', () => {
    expect(auditActionVariant('project.purge')).toBe('error')
    expect(auditActionVariant('file.delete')).toBe('error')
    expect(auditActionVariant('mitigation.rows_removed')).toBe('error')
    expect(auditActionVariant('project.archive')).toBe('warning')
    expect(auditActionVariant('library.delete')).toBe('error')
    expect(auditActionVariant('library.replace_file')).toBe('warning')
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

  const PLACE_LABELS = { mitigation: 'Mitigation plan – Tool 4', semp_plan: 'SEMP Plan' }
  const placeLabel = (key) => PLACE_LABELS[key] ?? key

  it('describes a deleted project document with the place label from /lookups', () => {
    const { fields } = describeAuditEntry(
      { snapshot: { name: 'Permit.pdf', area: 'documents', category: 'mitigation', size: 2048 } },
      { placeLabel }
    )
    expect(fields).toEqual([
      { label: 'Name', value: 'Permit.pdf' },
      { label: 'Area', value: 'Project documents' },
      { label: 'Category', value: 'Mitigation plan – Tool 4' },
      { label: 'Size', value: '2 KB' },
    ])
    const other = describeAuditEntry(
      { snapshot: { area: 'documents', category: 'other' } },
      { placeLabel }
    )
    expect(other.fields).toContainEqual({ label: 'Category', value: 'Other' })
  })

  it('still reads an entry written before phase 7b (Annex A–H)', () => {
    const { fields } = describeAuditEntry(
      { snapshot: { name: 'Old.pdf', area: 'annex', category: 'annex_c' } },
      { placeLabel }
    )
    expect(fields).toEqual([
      { label: 'Name', value: 'Old.pdf' },
      { label: 'Area', value: 'Annex (before phase 7b)' },
      { label: 'Category', value: 'Annex C (before phase 7b)' },
    ])
  })

  it('without place labels, shows the key', () => {
    const { fields } = describeAuditEntry({ snapshot: { category: 'mitigation' } })
    expect(fields).toEqual([{ label: 'Category', value: 'mitigation' }])
  })

  it('describes a deleted library document and a replaced PDF', () => {
    const deleted = describeAuditEntry(
      {
        snapshot: {
          title: 'Annex 1',
          description: 'Examples',
          places: ['mitigation', 'semp_plan'],
          name: 'annex-1.pdf',
          size: 2048,
          uploaded_by_name: 'Sara',
        },
      },
      { placeLabel }
    )
    expect(Object.fromEntries(deleted.fields.map((f) => [f.label, f.value]))).toEqual({
      Title: 'Annex 1',
      Name: 'annex-1.pdf',
      Description: 'Examples',
      'Shown in': 'Mitigation plan – Tool 4, SEMP Plan',
      Size: '2 KB',
      'Uploaded by': 'Sara',
    })
    const general = describeAuditEntry({ snapshot: { places: [] } }, { placeLabel })
    expect(general.fields).toEqual([{ label: 'Shown in', value: 'General — Library only' }])

    const replaced = describeAuditEntry({
      snapshot: { title: 'Annex 1', old_name: 'a.pdf', old_size: 1024 },
      details: { new_name: 'b.pdf', new_size: 2048 },
    })
    expect(replaced.fields).toEqual([
      { label: 'Title', value: 'Annex 1' },
      { label: 'Old file', value: 'a.pdf' },
      { label: 'Old size', value: '1 KB' },
      { label: 'New file', value: 'b.pdf' },
      { label: 'New size', value: '2 KB' },
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
