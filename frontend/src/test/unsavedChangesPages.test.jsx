/**
 * The shared unsaved-changes guard on every editing page (D61, phase 10a): after an edit, an
 * in-app link and the browser Back open Save / Discard / Stay; without an edit they leave at once.
 * The guard's own choices are tested in contexts/UnsavedChangesContext.test.jsx.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { Link, Outlet } from 'react-router-dom'
import api from '@/services/api'
import ProjectLayout from '@/components/layout/ProjectLayout'
import SempFullWidthLayout from '@/components/layout/SempFullWidthLayout'
import ProjectOverviewPage from '@/pages/project-workspace/overview/ProjectOverviewPage'
import ScreeningRouter from '@/pages/project-workspace/screening/ScreeningRouter'
import AssessmentMetadataPage from '@/pages/project-workspace/assessment/AssessmentMetadataPage'
import AssessmentMethodsPage from '@/pages/project-workspace/assessment/AssessmentMethodsPage'
import AssessmentScoringPage from '@/pages/project-workspace/assessment/AssessmentScoringPage'
import ManagementActivitiesPage from '@/pages/project-workspace/semp/ManagementActivitiesPage'
import MitigationPlanPage from '@/pages/project-workspace/semp/MitigationPlanPage'
import MonitoringDataEntryPage from '@/pages/project-workspace/monitoring/MonitoringDataEntryPage'
import ProjectCreatePage from '@/pages/projects/ProjectCreatePage'
import LibraryPage from '@/pages/library/LibraryPage'
import { UsersManagementSection } from '@/components/settings/UsersManagementSection'
import { lookupsFixture, mockGet, signIn, workspaceFixture } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn(), put: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

function WithLink() {
  return (
    <>
      <Link to="/app/elsewhere">Elsewhere</Link>
      <Outlet />
    </>
  )
}

const routes = [
  {
    element: <WithLink />,
    children: [
      { path: '/app/start', element: <p>Start page</p> },
      { path: '/app/elsewhere', element: <p>Elsewhere page</p> },
      { path: '/app/projects/new', element: <ProjectCreatePage /> },
      { path: '/app/library', element: <LibraryPage /> },
      { path: '/app/settings', element: <UsersManagementSection /> },
      {
        path: '/app/projects/:projectId',
        element: <ProjectLayout />,
        children: [
          { path: 'overview', element: <ProjectOverviewPage /> },
          { path: 'screening', element: <ScreeningRouter /> },
          { path: 'assessment/metadata', element: <AssessmentMetadataPage /> },
          { path: 'assessment/methods', element: <AssessmentMethodsPage /> },
          { path: 'assessment/scoring', element: <AssessmentScoringPage /> },
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
    ],
  },
]

const assessment = {
  _id: 'a1',
  project: 'p1',
  status: 'draft',
  updatedAt: '2026-11-05T10:00:00.000Z',
  project_activity: 'Pipes',
  description: 'Replace pipes',
  methods: [],
  consultations: [],
  scores: [],
}

const lookups = {
  ...lookupsFixture(),
  impact_categories: [{ _id: 'c1', code: 'A', name: 'Air quality' }],
  indicators: [{ _id: 'i1', name: 'Dust', category: 'c1' }],
}

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

function mockApi({ allowed = [], permissions = ['edit'], workspaceSteps = steps } = {}) {
  mockGet(api, {
    '/auth/me': {
      user: { _id: 'u1', name: 'Rana', email: 'rana@example.com', role: 'admin' },
      permissions,
    },
    '/projects/p1/workspace': workspaceFixture({
      allowed_actions: allowed,
      steps: workspaceSteps,
      project: {
        updatedAt: '2026-11-05T09:00:00.000Z',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
      },
    }),
    '/screenings/project/p1': null,
    '/assessments/project/p1': assessment,
    '/management/project/p1': [{ _id: 'r1', serial_number: 1, activity_description: 'Dig' }],
    '/mitigation/project/p1': [{ _id: 'r2', serial_number: 1, output_description: 'Network' }],
    '/monitoring/project/p1': [],
    '/lookups': lookups,
    '/users': [
      { _id: 'u2', name: 'Omar', email: 'omar@example.com', role: 'viewer', is_active: true },
    ],
    '/library': [],
  })
}

const typeIn = (element, value) => fireEvent.change(element, { target: { value } })
const typeInCell = (cell, value) => {
  cell.textContent = value
  fireEvent.input(cell)
}
const firstCell = () => document.querySelector('[contenteditable="true"]')

// Each editing page: where it lives, what it needs, how to wait for it and how to edit it.
const pages = [
  {
    name: 'screening form',
    path: '/app/projects/p1/screening',
    allowed: ['screening.create'],
    ready: () => screen.findByText('Submit Screening'),
    edit: () =>
      typeIn(
        screen.getByPlaceholderText('Describe any potential adverse effects on the environment...'),
        'Dust'
      ),
  },
  {
    name: 'assessment metadata',
    path: '/app/projects/p1/assessment/metadata',
    allowed: ['assessment.edit'],
    ready: () => screen.findByText('Save and Continue'),
    edit: () => typeIn(screen.getByDisplayValue('Pipes'), 'Pipes and pumps'),
  },
  {
    name: 'assessment methods and consultations',
    path: '/app/projects/p1/assessment/methods',
    allowed: ['assessment.edit'],
    ready: () => screen.findByText('Save and Continue'),
    edit: () => fireEvent.click(screen.getAllByRole('checkbox')[0]),
  },
  {
    name: 'assessment scoring',
    path: '/app/projects/p1/assessment/scoring',
    allowed: ['assessment.edit'],
    ready: () => screen.findByText('Submit Assessment'),
    edit: () =>
      typeIn(
        screen.getByPlaceholderText(
          'Describe the potential negative consequences of the project...'
        ),
        'Dust'
      ),
  },
  {
    name: 'Tool 3 management activities',
    path: '/app/projects/p1/semp/activities',
    allowed: ['semp.edit'],
    ready: async () => {
      await screen.findByText('Environmental & Social Management')
      await waitFor(() => expect(firstCell()).not.toBeNull())
    },
    edit: () => typeInCell(firstCell(), 'Dig deeper'),
  },
  {
    name: 'Tool 4 mitigation plan',
    path: '/app/projects/p1/semp/mitigation',
    allowed: ['semp.edit'],
    ready: async () => {
      await waitFor(() => expect(firstCell()).not.toBeNull())
    },
    edit: () => typeInCell(firstCell(), 'Network, phase 2'),
  },
  {
    name: 'Tool 5 monitoring data entry',
    path: '/app/projects/p1/monitoring/data-entry',
    allowed: ['monitoring.edit'],
    ready: () => screen.findByLabelText('Baseline'),
    edit: () => typeIn(screen.getByLabelText('Baseline'), '12'),
  },
  {
    name: 'project create',
    path: '/app/projects/new',
    ready: () => screen.findByLabelText(/Project Title/),
    edit: () => typeIn(screen.getByLabelText(/Project Title/), 'Water network'),
  },
  {
    name: 'project edit',
    path: '/app/projects/p1/overview',
    allowed: ['project.edit'],
    ready: async () => {
      fireEvent.click(await screen.findByRole('button', { name: 'Edit Project' }))
      await screen.findByRole('dialog', { name: 'Edit Project' })
    },
    edit: () => typeIn(screen.getByLabelText(/Project Title/), 'Water network II'),
  },
  {
    name: 'user form (edit)',
    path: '/app/settings',
    permissions: ['manage_users'],
    ready: async () => {
      fireEvent.click(await screen.findByRole('button', { name: /Edit Omar/i }))
      await screen.findByRole('dialog', { name: 'Edit User' })
    },
    edit: () => typeIn(screen.getByLabelText(/^Name/), 'Omar K.'),
  },
  {
    name: 'library document form',
    path: '/app/library',
    permissions: ['manage_library'],
    ready: async () => {
      fireEvent.click(await screen.findByRole('button', { name: /Upload document/ }))
      await screen.findByLabelText(/^Title/)
    },
    edit: () => typeIn(screen.getByLabelText(/^Title/), 'Annex 1'),
  },
]

const guardDialog = () => screen.queryByRole('dialog', { name: 'Unsaved changes' })

function render(page) {
  mockApi({ allowed: page.allowed, permissions: page.permissions ?? ['edit'] })
  // The history starts one step earlier, so the browser Back has somewhere to go
  return renderApp(routes, ['/app/start', page.path])
}

describe.each(pages)('unsaved-changes guard: $name (D61)', (page) => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    signIn({ user: { _id: 'u1', name: 'Rana', email: 'rana@example.com', role: 'admin' } })
  })

  it('without an edit an in-app link leaves at once', async () => {
    render(page)
    await page.ready()

    fireEvent.click(screen.getByRole('link', { name: 'Elsewhere' }))

    expect(await screen.findByText('Elsewhere page')).toBeInTheDocument()
    expect(guardDialog()).toBeNull()
  })

  it('after an edit an in-app link opens Save / Discard / Stay; Stay keeps the input', async () => {
    render(page)
    await page.ready()
    page.edit()

    fireEvent.click(screen.getByRole('link', { name: 'Elsewhere' }))

    expect(await screen.findByRole('dialog', { name: 'Unsaved changes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Discard changes' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Stay' }))
    await waitFor(() => expect(guardDialog()).toBeNull())
    expect(screen.queryByText('Elsewhere page')).toBeNull()
  })

  it('after an edit the browser Back asks too; Discard leaves', async () => {
    const { router } = render(page)
    await page.ready()
    page.edit()

    act(() => {
      router.navigate(-1)
    })
    expect(await screen.findByRole('dialog', { name: 'Unsaved changes' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(await screen.findByText('Start page')).toBeInTheDocument()
  })
})
