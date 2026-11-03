import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from './api'
import { screeningService } from './screeningService'
import { assessmentService } from './assessmentService'

vi.mock('./api', () => ({ default: { patch: vi.fn() } }))

describe('submit uses the transition endpoints (no status in PUT)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.patch.mockResolvedValue({ data: { data: { _id: 'x1', status: 'submitted' } } })
  })

  it('screeningService.submit → PATCH /screenings/:id/submit', async () => {
    const data = await screeningService.submit('x1')
    expect(api.patch).toHaveBeenCalledWith('/screenings/x1/submit')
    expect(data.status).toBe('submitted')
  })

  it('assessmentService.submit → PATCH /assessments/:id/submit', async () => {
    const data = await assessmentService.submit('x1')
    expect(api.patch).toHaveBeenCalledWith('/assessments/x1/submit')
    expect(data.status).toBe('submitted')
  })
})
