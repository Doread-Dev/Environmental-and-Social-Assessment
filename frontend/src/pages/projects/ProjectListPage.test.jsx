// Phase 12 (D76 3): the Projects page — search, status and risk filters, sort, pagination, the
// archived view (D17), create button by permission, opening a project, load error.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import api from '@/services/api'
import ProjectListPage from './ProjectListPage'
import { fail, ok, signIn, workspaceFixture } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn() },
}))

const project = (id, title, extra = {}) => ({
  _id: id,
  title,
  location: extra.location ?? 'Aleppo',
  start_date: '2026-01-01',
  end_date: '2026-12-31',
  updatedAt: extra.updatedAt ?? '2026-02-01T00:00:00Z',
  screening: extra.category ? { category_code: extra.category } : null,
  workflow: { ...workspaceFixture().workflow, status: extra.status ?? 'draft' },
  allowed_actions: [],
})

const ACTIVE = [
  project('p1', 'Water network', {
    status: 'in_progress',
    category: 'B',
    updatedAt: '2026-03-01T00:00:00Z',
  }),
  project('p2', 'Solar school', { location: 'Homs', status: 'draft', category: 'A' }),
  project('p3', 'Clinic roof', {
    status: 'completed',
    category: 'C',
    updatedAt: '2026-01-01T00:00:00Z',
  }),
]
const ARCHIVED = [project('p9', 'Old bridge', { status: 'completed' })]

function answer({ permissions = ['create_project'], active = ACTIVE } = {}) {
  api.get.mockImplementation((url, config) => {
    if (url === '/auth/me') {
      return ok({ user: { _id: 'u1', name: 'Rana', role: 'project_manager' }, permissions })
    }
    if (url === '/projects') return ok(config?.params?.archived ? ARCHIVED : active)
    return fail(404)
  })
}

const routes = [
  { path: '/app/projects', element: <ProjectListPage /> },
  { path: '/app/projects/new', element: <p>create page</p> },
  { path: '/app/projects/:projectId/overview', element: <p>overview page</p> },
]
const titles = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map(
      (row) =>
        within(row).queryByText(/Water network|Solar school|Clinic roof|Old bridge/)?.textContent
    )
    .filter(Boolean)

describe('ProjectListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    signIn()
  })

  it('lists the projects, newest update first', async () => {
    answer()
    renderApp(routes, '/app/projects')
    expect(await screen.findByText('Water network')).toBeInTheDocument()
    expect(titles()).toEqual(['Water network', 'Solar school', 'Clinic roof'])
  })

  it('searches title and location, and clears filters from the empty state', async () => {
    answer()
    renderApp(routes, '/app/projects')
    await screen.findByText('Water network')
    const search = screen.getByPlaceholderText('Search project name or location...')
    fireEvent.change(search, { target: { value: 'homs' } })
    expect(titles()).toEqual(['Solar school'])
    fireEvent.change(search, { target: { value: 'nothing like this' } })
    expect(titles()).toEqual([])
    fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }))
    expect(titles()).toHaveLength(3)
  })

  it('filters by workflow status and by risk category', async () => {
    answer()
    renderApp(routes, '/app/projects')
    await screen.findByText('Water network')
    fireEvent.change(screen.getByLabelText('Status filter'), { target: { value: 'completed' } })
    expect(titles()).toEqual(['Clinic roof'])
    fireEvent.change(screen.getByLabelText('Status filter'), { target: { value: 'all' } })
    fireEvent.change(screen.getByLabelText('Risk category filter'), { target: { value: 'A' } })
    expect(titles()).toEqual(['Solar school'])
  })

  it('sorts by title and by start date', async () => {
    answer({
      active: [
        { ...ACTIVE[0], start_date: '2026-05-01' },
        { ...ACTIVE[1], start_date: '2026-02-01' },
        { ...ACTIVE[2], start_date: '2026-03-01' },
      ],
    })
    renderApp(routes, '/app/projects')
    await screen.findByText('Water network')
    fireEvent.change(screen.getByLabelText('Sort by:'), { target: { value: 'title' } })
    expect(titles()).toEqual(['Clinic roof', 'Solar school', 'Water network'])
    fireEvent.change(screen.getByLabelText('Sort by:'), { target: { value: 'startDate' } })
    expect(titles()).toEqual(['Solar school', 'Clinic roof', 'Water network'])
  })

  it('pages through long lists', async () => {
    answer({
      active: Array.from({ length: 12 }, (_, i) =>
        project(`p${i}`, `Water network ${String(i).padStart(2, '0')}`, {
          updatedAt: `2026-01-${String(28 - i).padStart(2, '0')}T00:00:00Z`,
        })
      ),
    })
    renderApp(routes, '/app/projects')
    await screen.findByText('Water network 00')
    expect(screen.getAllByText(/Water network \d\d/)).toHaveLength(10)
    window.scrollTo = vi.fn()
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }))
    expect(screen.getAllByText(/Water network \d\d/).map((el) => el.textContent)).toEqual([
      'Water network 10',
      'Water network 11',
    ])
  })

  it('shows the archived projects in their own view', async () => {
    answer()
    renderApp(routes, '/app/projects')
    await screen.findByText('Water network')
    fireEvent.change(screen.getByLabelText('Projects shown'), { target: { value: 'archived' } })
    expect(await screen.findByText('Old bridge')).toBeInTheDocument()
    expect(screen.queryByText('Water network')).not.toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/projects', { params: { archived: true } })
  })

  it('opens a project and the create page; no create button without permission', async () => {
    answer()
    const { router } = renderApp(routes, '/app/projects')
    fireEvent.click(await screen.findByText('Solar school'))
    await waitFor(() => expect(router.state.location.pathname).toBe('/app/projects/p2/overview'))

    await router.navigate('/app/projects')
    fireEvent.click(await screen.findByRole('button', { name: 'Create New Project' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/app/projects/new'))
  })

  it('hides Create New Project from a viewer', async () => {
    answer({ permissions: [] })
    renderApp(routes, '/app/projects')
    await screen.findByText('Water network')
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/auth/me'))
    expect(screen.queryByRole('button', { name: 'Create New Project' })).not.toBeInTheDocument()
  })

  it('shows the load error with Try again', async () => {
    api.get.mockImplementation((url) =>
      url === '/auth/me' ? ok({ user: { _id: 'u1' }, permissions: [] }) : fail(500, 'Server down')
    )
    renderApp(routes, '/app/projects')
    expect(await screen.findByText('Failed to load projects')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})
