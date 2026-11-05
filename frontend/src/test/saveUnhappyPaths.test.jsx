/**
 * Saves outside the happy path (D61, D62, phase 10a): a stale save opens the shared dialog
 * (Reload / Keep editing), a double click sends one request, and every server error on a save
 * shows the `extractErrorMessage` text.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import api from '@/services/api'
import ProjectLayout from '@/components/layout/ProjectLayout'
import SempFullWidthLayout from '@/components/layout/SempFullWidthLayout'
import ManagementActivitiesPage from '@/pages/project-workspace/semp/ManagementActivitiesPage'
import ScreeningRouter from '@/pages/project-workspace/screening/ScreeningRouter'
import AssessmentMetadataPage from '@/pages/project-workspace/assessment/AssessmentMetadataPage'
import AssessmentReviewPage from '@/pages/project-workspace/assessment/AssessmentReviewPage'
import ProjectOverviewPage from '@/pages/project-workspace/overview/ProjectOverviewPage'
import ProjectCreatePage from '@/pages/projects/ProjectCreatePage'
import { UsersManagementSection } from '@/components/settings/UsersManagementSection'
import { lookupsFixture, signIn, workspaceFixture } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn(), put: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

const routes = [
  { path: '/app/projects/new', element: <ProjectCreatePage /> },
  { path: '/app/settings', element: <UsersManagementSection /> },
  {
    path: '/app/projects/:projectId',
    element: <ProjectLayout />,
    children: [
      { path: 'overview', element: <ProjectOverviewPage /> },
      { path: 'screening', element: <ScreeningRouter /> },
      { path: 'assessment/metadata', element: <AssessmentMetadataPage /> },
      { path: 'assessment/review', element: <AssessmentReviewPage /> },
    ],
  },
  {
    path: '/app/projects/:projectId/semp',
    element: <SempFullWidthLayout />,
    children: [{ path: 'activities', element: <ManagementActivitiesPage /> }],
  },
]

const semp = {
  screening: { tool: 1, status: 'approved' },
  assessment: { tool: 2, status: 'approved' },
  semp: {
    tools: [3, 4],
    status: 'in_progress',
    management_activities: { count: 1, described: 1, status: 'completed' },
    mitigation_plans: { count: 0, described: 0, status: 'not_started' },
  },
}

const draftAssessment = {
  _id: 'a1',
  project: 'p1',
  status: 'draft',
  updatedAt: '2026-11-05T10:00:00.000Z',
  project_activity: 'Pipes',
  description: 'Replace pipes',
  environmental_setting: 'Urban',
  legal_requirements: 'Permit',
  methods: [],
  consultations: [],
  scores: [],
}

const ok = (data, extra = {}) => Promise.resolve({ data: { success: true, data, ...extra } })
const httpError = (status, error, code) => {
  const err = new Error(error)
  err.response = { status, data: { success: false, error, ...(code && { code }) } }
  return Promise.reject(err)
}
const STALE = 'Someone else changed this since you opened it. Reload to see the latest version.'

// GET answers by URL; `rows` can change between reads (someone else saved meanwhile).
function mockReads({ allowed = [], steps = semp, permissions = ['edit'], rows, assessment } = {}) {
  let table = rows ?? [{ _id: 'r1', serial_number: 1, activity_description: 'Dig' }]
  let tableVersion = 3
  api.get.mockImplementation((url) => {
    const answers = {
      '/auth/me': {
        user: { _id: 'u1', name: 'Rana', email: 'rana@example.com', role: 'admin' },
        permissions,
      },
      '/projects/p1/workspace': workspaceFixture({
        allowed_actions: allowed,
        steps,
        project: {
          updatedAt: '2026-11-05T09:00:00.000Z',
          start_date: '2026-01-01',
          end_date: '2026-12-31',
        },
      }),
      '/screenings/project/p1': null,
      '/assessments/project/p1': assessment ?? draftAssessment,
      '/lookups': lookupsFixture(),
      '/users': [],
      '/library': [],
    }
    if (url === '/management/project/p1') return ok(table, { version: tableVersion })
    if (Object.hasOwn(answers, url)) return ok(answers[url])
    return httpError(404, `No mock for GET ${url}`)
  })
  return {
    // Another user's save: the next read returns their table and a newer revision
    changeTable(next) {
      table = next
      tableVersion += 1
    },
  }
}

// The request goes out after a microtask: wait for it, give a second one time to come, count
async function expectOneCall(fn) {
  await waitFor(() => expect(fn).toHaveBeenCalled())
  await new Promise((resolve) => setTimeout(resolve, 30))
  expect(fn).toHaveBeenCalledTimes(1)
}

const firstCell = () => document.querySelector('[contenteditable="true"]')
const typeInCell = (value) => {
  const cell = firstCell()
  cell.textContent = value
  fireEvent.input(cell)
}

async function openTool3(options) {
  const reads = mockReads({ allowed: ['semp.edit'], ...options })
  const result = renderApp(routes, '/app/projects/p1/semp/activities')
  await waitFor(() => expect(firstCell()).not.toBeNull())
  return { ...result, ...reads }
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  signIn({ user: { _id: 'u1', name: 'Rana', email: 'rana@example.com', role: 'admin' } })
})

describe('stale saves: the shared dialog (D62, D73)', () => {
  it('a 409 STALE_VERSION opens "Someone else changed this"; Keep editing keeps what was typed', async () => {
    api.put.mockImplementation(() => httpError(409, STALE, 'STALE_VERSION'))
    await openTool3()

    typeInCell('Dig deeper')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(
      await screen.findByRole('dialog', { name: 'Someone else changed this' })
    ).toBeInTheDocument()
    // The save carried the revision the table was loaded with
    expect(api.put).toHaveBeenCalledWith(
      '/projects/p1/management',
      expect.objectContaining({ version: 3 })
    )
    // Shown once: not repeated as the page error
    expect(screen.queryByText(STALE)).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Someone else changed this' })).toBeNull()
    )
    expect(firstCell()).toHaveTextContent('Dig deeper')
  })

  it('Reload refetches the tool and the workspace and shows their changes', async () => {
    api.put.mockImplementation(() => httpError(409, STALE, 'STALE_VERSION'))
    const { changeTable } = await openTool3()
    typeInCell('Dig deeper')
    changeTable([{ _id: 'r1', serial_number: 1, activity_description: 'Dug by Omar' }])
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    const reads = (url) => api.get.mock.calls.filter(([u]) => u === url).length
    const before = {
      table: reads('/management/project/p1'),
      workspace: reads('/projects/p1/workspace'),
    }

    fireEvent.click(await screen.findByRole('button', { name: 'Reload' }))

    await waitFor(() => expect(firstCell()).toHaveTextContent('Dug by Omar'))
    expect(reads('/management/project/p1')).toBeGreaterThan(before.table)
    expect(reads('/projects/p1/workspace')).toBeGreaterThan(before.workspace)
    expect(screen.queryByRole('dialog')).toBeNull()

    // The next save sends the new revision
    api.put.mockImplementation((url, body) => ok(body.rows, { version: body.version + 1 }))
    typeInCell('Dug, checked')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(api.put).toHaveBeenLastCalledWith(
        '/projects/p1/management',
        expect.objectContaining({ version: 4 })
      )
    )
  })

  it('the project edit sends the version it opened with and shows the same dialog when stale', async () => {
    mockReads({ allowed: ['project.edit'] })
    api.put.mockImplementation(() => httpError(409, STALE, 'STALE_VERSION'))
    renderApp(routes, '/app/projects/p1/overview')

    fireEvent.click(await screen.findByRole('button', { name: 'Edit Project' }))
    fireEvent.change(screen.getByLabelText(/Project Title/), { target: { value: 'Renamed' } })
    fireEvent.change(screen.getByLabelText(/Project Component/), { target: { value: 'Pipes' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(
      await screen.findByRole('dialog', { name: 'Someone else changed this' })
    ).toBeInTheDocument()
    expect(api.put).toHaveBeenCalledWith(
      '/projects/p1',
      expect.objectContaining({ title: 'Renamed', version: '2026-11-05T09:00:00.000Z' })
    )
    // The edit form stays open with the typed title behind the dialog
    expect(screen.getByLabelText(/Project Title/)).toHaveValue('Renamed')
  })
})

describe('double actions: one request per action (D61)', () => {
  it('a double click on Save (Tool 3) sends one request', async () => {
    let resolve
    api.put.mockImplementation(
      () =>
        new Promise((r) => (resolve = () => r({ data: { success: true, data: [], version: 4 } })))
    )
    await openTool3()
    typeInCell('Dig deeper')

    const save = screen.getByRole('button', { name: 'Save' })
    fireEvent.click(save)
    fireEvent.click(save)

    await expectOneCall(api.put)
    resolve()
    await waitFor(() => expect(screen.getByRole('button', { name: /Saved/ })).toBeInTheDocument())
  })

  it('Save is disabled while its request runs', async () => {
    api.put.mockImplementation(() => new Promise(() => {}))
    await openTool3()
    typeInCell('Dig deeper')

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(screen.getByRole('button', { name: /Saving/ })).toBeDisabled())
  })

  it('a double click on Create (project create) creates one project', async () => {
    mockReads()
    api.post.mockImplementation(() => new Promise(() => {}))
    renderApp(routes, '/app/projects/new')
    const fill = (label, value) =>
      fireEvent.change(screen.getByLabelText(label), { target: { value } })
    fill(/Project Title/, 'Water network')
    fill(/Project Location/, 'Aleppo')
    fill(/Start Date/, '2026-01-01')
    fill(/End Date/, '2026-12-31')
    fill(/Project Component/, 'Pipes')

    const create = screen.getByRole('button', { name: /Save Project/ })
    fireEvent.click(create)
    fireEvent.click(create)

    await expectOneCall(api.post)
  })

  it('a double click on Approve sends one request', async () => {
    mockReads({
      allowed: ['assessment.approve', 'assessment.reject'],
      assessment: { ...draftAssessment, status: 'submitted' },
    })
    api.patch.mockImplementation(() => new Promise(() => {}))
    renderApp(routes, '/app/projects/p1/assessment/review')

    fireEvent.change(await screen.findByPlaceholderText(/recommendations/i), {
      target: { value: 'Proceed' },
    })
    // Approve asks first (D74 6); a double click on the dialog's Approve sends one request
    fireEvent.click(screen.getByRole('button', { name: /Approve & Complete Assessment/ }))
    const dialog = await screen.findByRole('dialog', { name: 'Approve the assessment?' })
    const approve = within(dialog).getByRole('button', { name: 'Approve' })
    fireEvent.click(approve)
    fireEvent.click(approve)

    await expectOneCall(api.patch)
  })

  it('a double click on Create User creates one account', async () => {
    mockReads({ permissions: ['manage_users'] })
    api.post.mockImplementation(() => new Promise(() => {}))
    renderApp(routes, '/app/settings')

    fireEvent.click(await screen.findByRole('button', { name: /Add User/ }))
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'Omar' } })
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: 'omar@example.com' } })
    const create = screen.getByRole('button', { name: 'Create User' })
    fireEvent.click(create)
    fireEvent.click(create)

    await expectOneCall(api.post)
  })
})

describe('server errors on a save show their reason (D61)', () => {
  it.each([
    ['400 validation', () => httpError(400, 'Row 1: activity_description is required')],
    ['403 role', () => httpError(403, 'Forbidden')],
    ['404 deleted project', () => httpError(404, 'Project not found')],
    ['409 gate', () => httpError(409, 'Tool 2 (Assessment) must be approved first')],
    ['500', () => httpError(500, 'Server Error')],
    [
      'network error',
      () => Promise.reject(Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' })),
    ],
  ])('%s', async (name, answer) => {
    api.put.mockImplementation(answer)
    await openTool3()
    typeInCell('Dig deeper')

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    const expected = {
      '400 validation': 'Row 1: activity_description is required',
      '403 role': "You don't have permission to perform this action.",
      '404 deleted project': 'Project not found',
      '409 gate': 'Tool 2 (Assessment) must be approved first',
      500: 'Server Error',
      'network error': 'Network error. Please check your connection.',
    }[name]
    expect(await screen.findByText(expected)).toBeInTheDocument()
    // The edit is still there to save again
    expect(firstCell()).toHaveTextContent('Dig deeper')
  })

  it('the assessment metadata page shows a failed save (it was silent before)', async () => {
    mockReads({ allowed: ['assessment.edit'] })
    api.put.mockImplementation(() => httpError(409, 'Cannot edit a assessment that is submitted'))
    renderApp(routes, '/app/projects/p1/assessment/metadata')

    fireEvent.click(await screen.findByRole('button', { name: /Save and Continue/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Cannot edit a assessment that is submitted'
    )
  })

  it('the assessment review shows a failed approve (it was silent before)', async () => {
    mockReads({
      allowed: ['assessment.approve', 'assessment.reject'],
      assessment: { ...draftAssessment, status: 'submitted' },
    })
    api.patch.mockImplementation(() =>
      httpError(409, 'Cannot approve a assessment that is approved')
    )
    renderApp(routes, '/app/projects/p1/assessment/review')

    fireEvent.change(await screen.findByPlaceholderText(/recommendations/i), {
      target: { value: 'Proceed' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Approve & Complete Assessment/ }))
    const dialog = await screen.findByRole('dialog', { name: 'Approve the assessment?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Approve' }))

    expect(
      await screen.findByText('Cannot approve a assessment that is approved')
    ).toBeInTheDocument()
  })
})
