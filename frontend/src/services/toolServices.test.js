// Phase 12 (D76 3): every call of the Tool 1 / Tool 2 services goes to the right endpoint with the
// right body and returns `data` (the version rule of D62 included).
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from './api'
import { screeningService } from './screeningService'
import { assessmentService } from './assessmentService'
import { createQueryClient } from './queryClient'

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() },
}))

const answer = (data) => Promise.resolve({ data: { success: true, data } })

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset?.()
  for (const method of ['get', 'post', 'put', 'patch']) {
    api[method].mockImplementation((url) => answer({ url }))
  }
})

describe('screeningService', () => {
  it.each([
    ['getByProject', ['p1'], 'get', '/screenings/project/p1', undefined],
    ['create', [{ project: 'p1' }], 'post', '/screenings', { project: 'p1' }],
    ['update', ['s1', { version: 'v' }], 'put', '/screenings/s1', { version: 'v' }],
    ['submit', ['s1', 'v1'], 'patch', '/screenings/s1/submit', { version: 'v1' }],
    ['approve', ['s1', 'Go on'], 'patch', '/screenings/s1/approve', { recommendations: 'Go on' }],
    ['reject', ['s1', 'Why'], 'patch', '/screenings/s1/reject', { reject_reason: 'Why' }],
  ])('%s → %s %s', async (name, args, method, url, body) => {
    const result = await screeningService[name](...args)
    expect(result).toEqual({ url })
    if (body === undefined) expect(api[method]).toHaveBeenCalledWith(url)
    else expect(api[method]).toHaveBeenCalledWith(url, body)
  })
})

describe('assessmentService', () => {
  it.each([
    ['getByProject', ['p1'], 'get', '/assessments/project/p1', undefined],
    ['create', [{ project: 'p1' }], 'post', '/assessments', { project: 'p1' }],
    ['update', ['a1', { version: 'v' }], 'put', '/assessments/a1', { version: 'v' }],
    [
      'setMethods',
      ['a1', [{ method_type: 'x' }], 'v'],
      'put',
      '/assessments/a1/methods',
      {
        version: 'v',
        methods: [{ method_type: 'x' }],
      },
    ],
    [
      'setConsultations',
      ['a1', [{ type: 'y' }], 'v'],
      'put',
      '/assessments/a1/consultations',
      {
        version: 'v',
        consultations: [{ type: 'y' }],
      },
    ],
    [
      'addScores',
      ['a1', [{ question: 'q', level: 'low' }], 'v'],
      'post',
      '/assessments/a1/scores',
      {
        version: 'v',
        scores: [{ question: 'q', level: 'low' }],
      },
    ],
    ['submit', ['a1', 'v'], 'patch', '/assessments/a1/submit', { version: 'v' }],
    ['approve', ['a1', 'Plan'], 'patch', '/assessments/a1/approve', { recommendations: 'Plan' }],
    ['reject', ['a1', 'No'], 'patch', '/assessments/a1/reject', { reject_reason: 'No' }],
  ])('%s → %s %s', async (name, args, method, url, body) => {
    const result = await assessmentService[name](...args)
    expect(result).toEqual({ url })
    if (body === undefined) expect(api[method]).toHaveBeenCalledWith(url)
    else expect(api[method]).toHaveBeenCalledWith(url, body)
  })

  it('passes an API error on to the caller', async () => {
    const error = Object.assign(new Error('Conflict'), { response: { status: 409 } })
    api.patch.mockRejectedValueOnce(error)
    await expect(assessmentService.submit('a1', 'old')).rejects.toBe(error)
  })
})

describe('createQueryClient', () => {
  const options = () => createQueryClient().getDefaultOptions()

  it('keeps data fresh for 30 s, does not refetch on focus and never retries mutations', () => {
    const { queries, mutations } = options()
    expect(queries.staleTime).toBe(30_000)
    expect(queries.refetchOnWindowFocus).toBe(false)
    expect(mutations.retry).toBe(false)
  })

  it('never retries a 4xx and retries other failures once', () => {
    const { retry } = options().queries
    const withStatus = (status) => ({ response: { status } })
    expect(retry(0, withStatus(404))).toBe(false)
    expect(retry(0, withStatus(401))).toBe(false)
    expect(retry(0, withStatus(409))).toBe(false)
    expect(retry(0, withStatus(500))).toBe(true)
    expect(retry(0, new Error('Network Error'))).toBe(true)
    expect(retry(1, withStatus(503))).toBe(false)
  })
})
