import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import api from '@/services/api'
import WorkflowRouteGuard from './WorkflowRouteGuard'
import { getUrls, mockGet, signIn, workspaceFixture } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn() },
}))

const STEP_PAGES = ['screening', 'assessment', 'semp', 'monitoring']

const routes = [
  {
    path: '/app/projects/:projectId',
    children: [
      ...STEP_PAGES.map((step) => ({ path: step, element: <p>{step} page</p> })),
      {
        element: <WorkflowRouteGuard step="assessment" />,
        children: [{ path: 'assessment/metadata', element: <p>assessment tool</p> }],
      },
      {
        element: <WorkflowRouteGuard step="semp" />,
        children: [{ path: 'semp/activities', element: <p>semp tool</p> }],
      },
      {
        element: <WorkflowRouteGuard step="monitoring" />,
        children: [{ path: 'monitoring/data-entry', element: <p>monitoring tool</p> }],
      },
    ],
  },
]

function renderAt(path, steps) {
  mockGet(api, {
    '/auth/me': { user: { _id: 'u1' }, permissions: ['edit'] },
    '/projects/p1/workspace': workspaceFixture({ steps }),
  })
  return renderApp(routes, path)
}

const open = (status) => ({ tool: 0, status })
const SCREENING_ONLY = { screening: open('in_progress') }
const SCREENING_APPROVED = { screening: open('approved'), assessment: open('in_progress') }
const ASSESSMENT_APPROVED = {
  screening: open('approved'),
  assessment: open('approved'),
  semp: { ...open('in_progress'), management_activities: {}, mitigation_plans: {} },
}
const SEMP_COMPLETE = {
  ...ASSESSMENT_APPROVED,
  semp: open('completed'),
  monitoring: open('not_started'),
}

describe('WorkflowRouteGuard reads the backend workflow (D30)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    signIn()
  })

  it.each([
    ['assessment/metadata', SCREENING_ONLY, 'screening page'],
    ['semp/activities', SCREENING_ONLY, 'screening page'],
    ['semp/activities', SCREENING_APPROVED, 'assessment page'],
    ['monitoring/data-entry', SCREENING_APPROVED, 'assessment page'],
    ['monitoring/data-entry', ASSESSMENT_APPROVED, 'semp page'],
  ])('a locked %s sends the user to the open step before it (%#)', async (page, steps, landing) => {
    const { router } = renderAt(`/app/projects/p1/${page}`, steps)

    expect(await screen.findByText(landing)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(`/app/projects/p1/${landing.split(' ')[0]}`)
  })

  it.each([
    ['assessment/metadata', SCREENING_APPROVED, 'assessment tool'],
    ['semp/activities', ASSESSMENT_APPROVED, 'semp tool'],
    ['monitoring/data-entry', SEMP_COMPLETE, 'monitoring tool'],
  ])('an open %s is shown', async (page, steps, content) => {
    renderAt(`/app/projects/p1/${page}`, steps)

    expect(await screen.findByText(content)).toBeInTheDocument()
  })

  it('makes one workspace request, nothing per tool', async () => {
    renderAt('/app/projects/p1/monitoring/data-entry', SEMP_COMPLETE)

    await screen.findByText('monitoring tool')
    await waitFor(() => expect(getUrls(api).sort()).toEqual(['/auth/me', '/projects/p1/workspace']))
  })
})
