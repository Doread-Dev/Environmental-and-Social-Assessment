import { describe, expect, it } from 'vitest'
import { deriveMonitoringStatus, WORKFLOW_STATUS } from './workflowDerivation'

const sempCompleted = { status: WORKFLOW_STATUS.COMPLETED }

describe('deriveMonitoringStatus', () => {
  it('is locked until SEMP is completed', () => {
    expect(deriveMonitoringStatus([{ scores: { Q1: '1' } }], { status: 'in_progress' })).toEqual({
      status: WORKFLOW_STATUS.PENDING,
      tool: 5,
      locked: true,
    })
  })

  it('is pending without records', () => {
    expect(deriveMonitoringStatus([], sempCompleted).status).toBe(WORKFLOW_STATUS.PENDING)
  })

  it('is in progress as soon as a record exists, even with only a baseline', () => {
    const records = [{ scores: { baseline: '10' } }]
    expect(deriveMonitoringStatus(records, sempCompleted).status).toBe(WORKFLOW_STATUS.IN_PROGRESS)
  })

  it('is completed once one record has all four quarters', () => {
    const records = [{ scores: { Q1: '1', Q2: '2', Q3: '3', Q4: '4' } }, { scores: {} }]
    expect(deriveMonitoringStatus(records, sempCompleted).status).toBe(WORKFLOW_STATUS.COMPLETED)
  })
})
