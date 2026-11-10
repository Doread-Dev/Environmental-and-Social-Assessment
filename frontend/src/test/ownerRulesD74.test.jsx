/**
 * The owner's answers to the phase 10a questions (D74), in the pages: project dates, assessment
 * metadata at submit, export with unsaved edits, the 30,000-character limit, recommendations
 * required to approve, and one approve / reject confirmation in both reviewed tools.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import api from '@/services/api'
import { exportTool } from '@/utils/excelExport'
import ProjectLayout from '@/components/layout/ProjectLayout'
import SempFullWidthLayout from '@/components/layout/SempFullWidthLayout'
import ProjectCreatePage from '@/pages/projects/ProjectCreatePage'
import ScreeningRouter from '@/pages/project-workspace/screening/ScreeningRouter'
import AssessmentMetadataPage from '@/pages/project-workspace/assessment/AssessmentMetadataPage'
import AssessmentScoringPage from '@/pages/project-workspace/assessment/AssessmentScoringPage'
import AssessmentReviewPage from '@/pages/project-workspace/assessment/AssessmentReviewPage'
import ManagementActivitiesPage from '@/pages/project-workspace/semp/ManagementActivitiesPage'
import MitigationPlanPage from '@/pages/project-workspace/semp/MitigationPlanPage'
import MonitoringDataEntryPage from '@/pages/project-workspace/monitoring/MonitoringDataEntryPage'
import { Input, Textarea } from '@/components/ui'
import { lookupsFixture, signIn, workspaceFixture } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn(), put: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

// The workbook builder is tested on its own; here only what it is given
vi.mock('@/utils/excelExport', () => ({
  exportTool: vi.fn(async () => 'Tool.xlsx'),
  exportStatus: (workflow) => workflow?.status,
}))

const routes = [
  { path: '/app/projects/new', element: <ProjectCreatePage /> },
  { path: '/app/projects/:projectId/overview', element: <p>Overview page</p> },
  {
    path: '/app/projects/:projectId',
    element: <ProjectLayout />,
    children: [
      { path: 'screening', element: <ScreeningRouter /> },
      { path: 'assessment/metadata', element: <AssessmentMetadataPage /> },
      { path: 'assessment/methods', element: <p>Methods page</p> },
      { path: 'assessment/scoring', element: <AssessmentScoringPage /> },
      { path: 'assessment/review', element: <AssessmentReviewPage /> },
      { path: 'monitoring/data-entry', element: <MonitoringDataEntryPage /> },
    ],
  },
  {
    path: '/app/projects/:projectId/semp',
    element: <SempFullWidthLayout />,
    children: [
      { path: 'activities', element: <ManagementActivitiesPage /> },
      { path: 'mitigation', element: <MitigationPlanPage /> },
    ],
  },
]

const steps = {
  screening: { tool: 1, status: 'approved' },
  assessment: { tool: 2, status: 'approved' },
  semp: {
    tools: [3, 4],
    status: 'completed',
    management_activities: { count: 1, described: 1, status: 'completed' },
    mitigation_plans: { count: 1, described: 1, status: 'completed' },
  },
  monitoring: { tool: 5, status: 'in_progress', records: 0, complete_records: 0 },
}

const ok = (data, extra = {}) => Promise.resolve({ data: { success: true, data, ...extra } })
const httpError = (status, error, code) =>
  Promise.reject(
    Object.assign(new Error(error), {
      response: { status, data: { success: false, error, ...(code && { code }) } },
    })
  )

// GET answers; the workspace status moves on after a save (the export must take the new one)
function mockReads({ allowed = [], records = {} } = {}) {
  const state = { status: 'in_progress' }
  api.get.mockImplementation((url) => {
    const answers = {
      '/auth/me': { user: { _id: 'u1', name: 'Rana', role: 'admin' }, permissions: ['edit'] },
      '/projects/p1/workspace': {
        ...workspaceFixture({ allowed_actions: allowed, steps }),
        workflow: { ...workspaceFixture({ steps }).workflow, steps, status: state.status },
      },
      '/lookups': {
        ...lookupsFixture(),
        impact_categories: [{ _id: 'c1', code: 'A', name: 'Air quality' }],
        indicators: [{ _id: 'i1', name: 'Dust', category: 'c1' }],
      },
      '/users': [],
      '/library': [],
      ...records,
    }
    if (url === '/management/project/p1') {
      return ok([{ _id: 'r1', serial_number: 1, activity_description: 'Dig' }], { version: 3 })
    }
    if (url === '/mitigation/project/p1') {
      return ok([{ _id: 'r2', serial_number: 1, output_description: 'Network' }], { version: 5 })
    }
    if (url === '/monitoring/project/p1') return ok([], { version: 0 })
    if (Object.hasOwn(answers, url)) return ok(answers[url])
    return httpError(404, `No mock for GET ${url}`)
  })
  return state
}

const firstCell = () => document.querySelector('[contenteditable="true"]')
const typeInCell = (value) => {
  const cell = firstCell()
  cell.textContent = value
  fireEvent.input(cell)
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  signIn({ user: { _id: 'u1', name: 'Rana', role: 'admin' } })
})

describe('project dates (D74 1)', () => {
  const fill = (label, value) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } })
  const fillProject = (start, end) => {
    fill(/Project Title/, 'Water network')
    fill(/Project Location/, 'Aleppo')
    fill(/Start Date/, start)
    fill(/End Date/, end)
    fill(/Project Component/, 'Pipes')
  }

  it('a one-day project is accepted', async () => {
    mockReads()
    api.post.mockImplementation(() => ok({ _id: 'p9' }))
    renderApp(routes, '/app/projects/new')

    fillProject('2026-05-10', '2026-05-10')
    fireEvent.click(screen.getByRole('button', { name: /Save Project/ }))

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1))
  })

  it('an end date before the start date is refused with the backend wording', async () => {
    mockReads()
    renderApp(routes, '/app/projects/new')

    fillProject('2026-05-10', '2026-05-09')
    fireEvent.click(screen.getByRole('button', { name: /Save Project/ }))

    expect(await screen.findByText('End date cannot be before the start date')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })
})

describe('assessment metadata: free while draft, required at submit (D74 2)', () => {
  const assessment = {
    _id: 'a1',
    project: 'p1',
    status: 'draft',
    updatedAt: 'v1',
    project_activity: 'Pipes',
    description: 'Replace pipes',
    environmental_setting: '',
    legal_requirements: '',
    methods: [],
    consultations: [],
    scores: [],
  }

  it('"Save and Continue" saves a draft with empty fields and moves on', async () => {
    mockReads({ allowed: ['assessment.edit'], records: { '/assessments/project/p1': assessment } })
    api.put.mockImplementation((url, body) => ok({ ...assessment, ...body, updatedAt: 'v2' }))
    renderApp(routes, '/app/projects/p1/assessment/metadata')

    fireEvent.click(await screen.findByRole('button', { name: /Save and Continue/ }))

    expect(await screen.findByText('Methods page')).toBeInTheDocument()
    expect(api.put).toHaveBeenCalledWith(
      '/assessments/a1',
      expect.objectContaining({ environmental_setting: '', legal_requirements: '' })
    )
  })

  it('submit names the missing fields like the server and sends nothing', async () => {
    mockReads({ allowed: ['assessment.edit'], records: { '/assessments/project/p1': assessment } })
    renderApp(routes, '/app/projects/p1/assessment/scoring')

    fireEvent.change(await screen.findByPlaceholderText(/potential negative consequences/), {
      target: { value: 'Dust' },
    })
    fireEvent.change(screen.getByPlaceholderText(/expected positive outcomes/), {
      target: { value: 'Water' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Submit Assessment/ }))

    expect(
      await screen.findByText(
        'Fill in Environmental setting and Legal requirements before submitting'
      )
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Confirm Submission' })).toBeNull()
    expect(api.patch).not.toHaveBeenCalled()
  })
})

describe('export with unsaved edits (D74 3)', () => {
  const exportFrom = (event, toolType) =>
    window.dispatchEvent(new CustomEvent(event, { detail: toolType && { toolType } }))

  it('Tool 3: asks; "Save and export" saves, then exports the saved table with the new status', async () => {
    const state = mockReads({ allowed: ['semp.edit'] })
    api.put.mockImplementation((url, body) => {
      state.status = 'monitoring'
      return ok(
        [{ _id: 'r1', serial_number: 1, activity_description: body.rows[0].activity_description }],
        { version: 4 }
      )
    })
    renderApp(routes, '/app/projects/p1/semp/activities')
    await waitFor(() => expect(firstCell()).not.toBeNull())
    typeInCell('Dig deeper')

    exportFrom('semp-export', 'tool3')
    const dialog = await screen.findByRole('dialog', { name: 'You have unsaved changes' })
    expect(exportTool).not.toHaveBeenCalled()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save and export' }))

    await waitFor(() => expect(exportTool).toHaveBeenCalledTimes(1))
    expect(api.put).toHaveBeenCalledTimes(1)
    const [tool, data, status] = exportTool.mock.calls[0]
    expect(tool).toBe('tool3')
    expect(data.rows.map((r) => r.activity_description)).toEqual(['Dig deeper'])
    expect(status).toBe('monitoring')
  })

  it('Tool 3: Cancel exports nothing and keeps the edit', async () => {
    mockReads({ allowed: ['semp.edit'] })
    renderApp(routes, '/app/projects/p1/semp/activities')
    await waitFor(() => expect(firstCell()).not.toBeNull())
    typeInCell('Dig deeper')

    exportFrom('semp-export', 'tool3')
    fireEvent.click(
      within(await screen.findByRole('dialog', { name: 'You have unsaved changes' })).getByRole(
        'button',
        { name: 'Cancel' }
      )
    )

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(exportTool).not.toHaveBeenCalled()
    expect(api.put).not.toHaveBeenCalled()
    expect(firstCell()).toHaveTextContent('Dig deeper')
  })

  it('Tool 3: a failed save (stale 409) exports nothing', async () => {
    mockReads({ allowed: ['semp.edit'] })
    api.put.mockImplementation(() =>
      httpError(409, 'Someone else changed this since you opened it.', 'STALE_VERSION')
    )
    renderApp(routes, '/app/projects/p1/semp/activities')
    await waitFor(() => expect(firstCell()).not.toBeNull())
    typeInCell('Dig deeper')

    exportFrom('semp-export', 'tool3')
    fireEvent.click(
      within(await screen.findByRole('dialog', { name: 'You have unsaved changes' })).getByRole(
        'button',
        { name: 'Save and export' }
      )
    )

    expect(
      await screen.findByRole('dialog', { name: 'Someone else changed this' })
    ).toBeInTheDocument()
    expect(exportTool).not.toHaveBeenCalled()
  })

  it('Tool 3: without changes it exports the saved table at once', async () => {
    mockReads({ allowed: ['semp.edit'] })
    renderApp(routes, '/app/projects/p1/semp/activities')
    await waitFor(() => expect(firstCell()).not.toBeNull())

    exportFrom('semp-export', 'tool3')

    await waitFor(() => expect(exportTool).toHaveBeenCalledTimes(1))
    expect(screen.queryByRole('dialog', { name: 'You have unsaved changes' })).toBeNull()
    expect(exportTool.mock.calls[0][1].rows.map((r) => r.activity_description)).toEqual(['Dig'])
  })

  it('Tool 4: asks, then saves and exports', async () => {
    mockReads({ allowed: ['semp.edit'] })
    api.put.mockImplementation((url, body) => ok(body.rows, { version: 6 }))
    renderApp(routes, '/app/projects/p1/semp/mitigation')
    await waitFor(() => expect(firstCell()).not.toBeNull())
    typeInCell('Network, phase 2')

    exportFrom('semp-export', 'tool4')
    fireEvent.click(
      within(await screen.findByRole('dialog', { name: 'You have unsaved changes' })).getByRole(
        'button',
        { name: 'Save and export' }
      )
    )

    await waitFor(() => expect(exportTool).toHaveBeenCalledTimes(1))
    expect(exportTool.mock.calls[0][0]).toBe('tool4')
    expect(exportTool.mock.calls[0][1].rows[0].output_description).toBe('Network, phase 2')
  })

  it('Tool 5: asks, then saves and exports the saved records', async () => {
    mockReads({
      allowed: ['monitoring.edit'],
      records: { '/assessments/project/p1': { _id: 'a1', status: 'approved', scores: [] } },
    })
    api.put.mockImplementation((url, body) =>
      ok(
        body.records.map((r) => ({ ...r, _id: 'm1' })),
        { version: 1 }
      )
    )
    renderApp(routes, '/app/projects/p1/monitoring/data-entry')
    fireEvent.change(await screen.findByLabelText('Baseline'), { target: { value: '12' } })

    exportFrom('monitoring-export')
    fireEvent.click(
      within(await screen.findByRole('dialog', { name: 'You have unsaved changes' })).getByRole(
        'button',
        { name: 'Save and export' }
      )
    )

    await waitFor(() => expect(exportTool).toHaveBeenCalledTimes(1))
    expect(exportTool.mock.calls[0][0]).toBe('tool5')
    expect(exportTool.mock.calls[0][1].records[0].scores.baseline).toBe('12')
  })
})

describe('free text is limited to 30,000 characters (D74 4)', () => {
  it('the shared Input and Textarea apply the limit; a smaller one passed wins', () => {
    render(
      <>
        <Input label="Free" />
        <Textarea label="Long" />
        <Input label="Short" maxLength={100} />
      </>
    )
    expect(screen.getByLabelText('Free')).toHaveAttribute('maxlength', '30000')
    expect(screen.getByLabelText('Long')).toHaveAttribute('maxlength', '30000')
    expect(screen.getByLabelText('Short')).toHaveAttribute('maxlength', '100')
  })

  it('monitoring quarter values carry it too', async () => {
    mockReads({ allowed: ['monitoring.edit'] })
    renderApp(routes, '/app/projects/p1/monitoring/data-entry')
    expect(await screen.findByLabelText('Baseline')).toHaveAttribute('maxlength', '30000')
    expect(screen.getByLabelText('Total')).toHaveAttribute('maxlength', '30000')
  })
})

// D74 5 and 6: recommendations required to approve; approve and reject confirm in both tools
describe.each([
  [
    'screening',
    '/app/projects/p1/screening',
    {
      '/screenings/project/p1': {
        _id: 's1',
        project: 'p1',
        status: 'submitted',
        category_code: 'B',
      },
    },
    ['screening.approve', 'screening.reject'],
    /Approve & Complete Screening/,
    /Recommendations/,
  ],
  [
    'assessment',
    '/app/projects/p1/assessment/review',
    {
      '/assessments/project/p1': {
        _id: 'a1',
        project: 'p1',
        status: 'submitted',
        methods: [],
        consultations: [],
        scores: [],
      },
    },
    ['assessment.approve', 'assessment.reject'],
    /Approve & Complete Assessment/,
    /recommendations/i,
  ],
])('%s review (D74 5, 6)', (tool, path, records, allowed, approveName, recommendationsField) => {
  const open = async () => {
    mockReads({ allowed, records })
    api.patch.mockImplementation((url, body) =>
      ok({
        ...Object.values(records)[0],
        status: url.endsWith('approve') ? 'approved' : 'rejected',
        ...body,
      })
    )
    renderApp(routes, path)
    return screen.findByRole('button', { name: approveName })
  }
  const recommendations = () =>
    screen
      .getAllByRole('textbox')
      .find((box) =>
        recommendationsField.test(box.id + box.placeholder + (box.labels?.[0]?.textContent ?? ''))
      )

  it('approve needs recommendations', async () => {
    const approve = await open()
    expect(approve).toBeDisabled()

    fireEvent.change(recommendations(), { target: { value: 'Proceed' } })
    expect(approve).toBeEnabled()
  })

  it('approve asks in the shared dialog; the request goes out only after "Approve"', async () => {
    const approve = await open()
    fireEvent.change(recommendations(), { target: { value: 'Proceed' } })

    fireEvent.click(approve)
    const dialog = await screen.findByRole('dialog', { name: `Approve the ${tool}?` })
    expect(dialog).toHaveTextContent(
      `The ${tool} is approved with your recommendations and can no longer be edited. The next tool opens for the project team.`
    )
    expect(api.patch).not.toHaveBeenCalled()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Approve' }))
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith(expect.stringMatching(/\/approve$/), {
        recommendations: 'Proceed',
      })
    )
  })

  it('reject asks in the shared dialog; Cancel sends nothing', async () => {
    await open()
    fireEvent.click(screen.getByRole('button', { name: /^close Reject$|^Reject$/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Confirm Rejection/ }))

    const dialog = await screen.findByRole('dialog', { name: `Reject the ${tool}?` })
    expect(dialog).toHaveTextContent(
      `The ${tool} goes back to the project team with your reason. They can edit it and submit it again.`
    )
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(api.patch).not.toHaveBeenCalled()
  })
})
