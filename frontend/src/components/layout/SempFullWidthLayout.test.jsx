// Phase 12a: the Tools 3/4 pages (SempFullWidthLayout) have the same phone/tablet menu as the
// other project pages; each tool's locked / done state in it matches the desktop sidebar of
// ProjectLayout. The header's Export Excel waits for the tool page (export events).
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import { useLocation } from 'react-router-dom'
import api from '@/services/api'
import ProjectLayout from './ProjectLayout'
import SempFullWidthLayout from './SempFullWidthLayout'
import { useExportHandler } from '@/components/export'
import { lookupsFixture, mockGet, signIn, workspaceFixture } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn() },
}))

const TOOLS = [
  'Screening – Tool 1',
  'Assessment – Tool 2',
  'SEMP – Tools 3 & 4',
  'Monitoring – Tool 5',
]

// Screening and assessment done, SEMP in progress, monitoring locked
const steps = {
  screening: { tool: 1, status: 'approved' },
  assessment: { tool: 2, status: 'approved' },
  semp: {
    tools: [3, 4],
    status: 'in_progress',
    management_activities: { count: 1, described: 1, status: 'completed' },
    mitigation_plans: { count: 0, described: 0, status: 'not_started' },
  },
  monitoring: { tool: 5, status: 'locked', records: 0, complete_records: 0 },
}

function mockApi({ semp = steps.semp, allowed = [] } = {}) {
  mockGet(api, {
    '/auth/me': { user: { _id: 'u1', name: 'Rana', role: 'project_manager' }, permissions: [] },
    '/projects/p1/workspace': workspaceFixture({
      allowed_actions: allowed,
      steps: { ...steps, semp },
    }),
    '/lookups': lookupsFixture(),
    '/library': [],
  })
}

function ToolPage({ ready = true }) {
  useExportHandler('semp-export', () => {}, ready)
  return <p>tool page</p>
}

const routes = (page = <ToolPage />) => [
  {
    path: '/app/projects/:projectId/semp',
    element: <SempFullWidthLayout />,
    children: [{ path: 'activities', element: page }],
  },
  {
    path: '/app/projects/:projectId',
    element: <ProjectLayout />,
    children: [{ path: 'overview', element: <p>overview page</p> }],
  },
]

function HelpTarget() {
  const location = useLocation()
  return <p>help page {location.search}</p>
}

// Tool 3 and Tool 1 with their place keys (as routes/index.jsx), and the Help page
const withPlace = () => [
  {
    path: '/app/projects/:projectId/semp',
    element: <SempFullWidthLayout />,
    children: [{ path: 'activities', handle: { place: 'management' }, element: <ToolPage /> }],
  },
  {
    path: '/app/projects/:projectId',
    element: <ProjectLayout />,
    children: [
      { path: 'overview', element: <p>overview page</p> },
      { path: 'screening', handle: { place: 'screening' }, element: <p>screening page</p> },
    ],
  },
  { path: '/app/help', element: <HelpTarget /> },
]

// The icon next to each tool: "lock", "check_circle" or the tool's own icon
const toolIcons = (container) =>
  TOOLS.map((label) => {
    const item = within(container).getByText(label).closest('a, div')
    const icon = item.querySelector('.material-symbols-outlined').textContent.trim()
    return icon === 'lock' || icon === 'check_circle' ? icon : 'open'
  })

const openMenu = async () => {
  fireEvent.click(await screen.findByRole('button', { name: 'Toggle menu' }))
  return screen.getByRole('dialog', { name: 'Mobile navigation' })
}

describe('SempFullWidthLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    signIn()
  })

  it('has a menu button that opens the project menu with every tool', async () => {
    mockApi()
    renderApp(routes(), '/app/projects/p1/semp/activities')
    expect(await screen.findByText('tool page')).toBeInTheDocument()
    const menu = await openMenu()
    TOOLS.forEach((label) => expect(within(menu).getByText(label)).toBeInTheDocument())
    expect(within(menu).getByText('Project Overview')).toBeInTheDocument()
  })

  it('shows each tool locked / done as the desktop sidebar does', async () => {
    mockApi()
    const first = renderApp(routes(), '/app/projects/p1/semp/activities')
    const menuStates = toolIcons(await openMenu())
    expect(menuStates).toEqual(['check_circle', 'check_circle', 'open', 'lock'])
    first.unmount()

    renderApp(routes(), '/app/projects/p1/overview')
    await screen.findByText('overview page')
    const sidebar = document.querySelector('aside')
    expect(toolIcons(sidebar)).toEqual(menuStates)
  })

  it('marks SEMP done in the menu once both tables are complete', async () => {
    mockApi({
      semp: {
        ...steps.semp,
        status: 'completed',
        mitigation_plans: { count: 1, described: 1, status: 'completed' },
      },
    })
    renderApp(routes(), '/app/projects/p1/semp/activities')
    expect(toolIcons(await openMenu())[2]).toBe('check_circle')
  })

  it('leads from the menu to the project overview', async () => {
    mockApi()
    renderApp(routes(), '/app/projects/p1/semp/activities')
    const menu = await openMenu()
    fireEvent.click(within(menu).getByText('Project Overview'))
    expect(await screen.findByText('overview page')).toBeInTheDocument()
  })

  it('keeps Export Excel disabled until the tool page answers it', async () => {
    mockApi({ allowed: ['export'] })
    const first = renderApp(routes(<ToolPage ready={false} />), '/app/projects/p1/semp/activities')
    expect(await screen.findByRole('button', { name: /Export Excel/ })).toBeDisabled()
    first.unmount()

    renderApp(routes(<ToolPage />), '/app/projects/p1/semp/activities')
    expect(await screen.findByRole('button', { name: /Export Excel/ })).toBeEnabled()
  })

  it('the floating Help button opens the guide at the page section, in both project layouts (D78)', async () => {
    mockApi()
    const first = renderApp(withPlace(), '/app/projects/p1/semp/activities')
    fireEvent.click(await screen.findByRole('button', { name: 'Help for this page' }))
    expect(await screen.findByText('help page ?section=management')).toBeInTheDocument()
    first.unmount()

    renderApp(withPlace(), '/app/projects/p1/screening')
    fireEvent.click(await screen.findByRole('button', { name: 'Help for this page' }))
    expect(await screen.findByText('help page ?section=screening')).toBeInTheDocument()
  })

  it('the overview has the floating Help button too; the project user menu leads to Help', async () => {
    mockApi()
    const first = renderApp(withPlace(), '/app/projects/p1/overview')
    await screen.findByText('overview page')
    fireEvent.click(screen.getByRole('button', { name: 'Help for this page' }))
    expect(await screen.findByText('help page ?section=project-overview')).toBeInTheDocument()
    first.unmount()

    renderApp(withPlace(), '/app/projects/p1/overview')
    await screen.findByText('overview page')
    const sidebar = document.querySelector('aside')
    fireEvent.click(within(sidebar).getByRole('button', { name: /Rana/ }))
    fireEvent.click(within(sidebar).getByRole('button', { name: /Help/ }))
    expect(await screen.findByText('help page')).toBeInTheDocument()
  })

  it('the mobile project menu has Help in its user menu', async () => {
    mockApi()
    renderApp(withPlace(), '/app/projects/p1/overview')
    await screen.findByText('overview page')
    const menu = await openMenu()
    fireEvent.click(within(menu).getByRole('button', { name: /Rana/ }))
    fireEvent.click(within(menu).getByRole('button', { name: /Help/ }))
    expect(await screen.findByText('help page')).toBeInTheDocument()
  })
})
