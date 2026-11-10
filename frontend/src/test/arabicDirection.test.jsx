// Phase 12a: Arabic user text (project title, location, descriptions) is shown with dir="auto"
// where it is displayed — the project list, the dashboard list, the project header and sidebar,
// the project details card and the Tools 3/4 grid cells — so it reads right to left.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import api from '@/services/api'
import ProjectListPage from '@/pages/projects/ProjectListPage'
import ProjectListItem from '@/components/dashboard/ProjectListItem'
import ProjectHeader from '@/components/project/ProjectHeader'
import ProjectDetailsCard from '@/components/project/ProjectDetailsCard'
import ProjectSidebar from '@/components/layout/ProjectSidebar'
import EditableCell from '@/components/semp/EditableCell'
import { fail, ok, signIn, workspaceFixture } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn() },
}))

const TITLE = 'إعادة تأهيل شبكة المياه'
const LOCATION = 'حلب'
const arabicProject = {
  _id: 'p1',
  title: TITLE,
  location: LOCATION,
  project_component: 'تمديد الأنابيب',
  start_date: '2026-01-01',
  end_date: '2026-12-31',
  updatedAt: '2026-02-01T00:00:00Z',
  screening: null,
  workflow: workspaceFixture().workflow,
  allowed_actions: [],
}

// The element that holds the text carries dir="auto"
const expectAuto = (text) => {
  const elements = screen.getAllByText(text)
  elements.forEach((element) => expect(element).toHaveAttribute('dir', 'auto'))
}

describe('Arabic user text is shown with dir="auto"', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    signIn()
  })

  it('in the project list (title and location)', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/auth/me') {
        return ok({ user: { _id: 'u1', name: 'Rana', role: 'viewer' }, permissions: [] })
      }
      if (url === '/projects') return ok([arabicProject])
      return fail(404)
    })
    renderApp([{ path: '/app/projects', element: <ProjectListPage /> }], '/app/projects')
    expect(await screen.findByText(TITLE)).toHaveAttribute('dir', 'auto')
    expectAuto(LOCATION)
  })

  it('in the dashboard project list', () => {
    render(
      <MemoryRouter>
        <ProjectListItem project={arabicProject} />
      </MemoryRouter>
    )
    expectAuto(TITLE)
    expectAuto(LOCATION)
  })

  // Header and sidebar need the app providers (theme, unsaved-changes guard, data router)
  const renderInApp = (element) => {
    api.get.mockImplementation((url) =>
      url === '/auth/me'
        ? ok({ user: { _id: 'u1', name: 'Rana', role: 'viewer' }, permissions: [] })
        : fail(404)
    )
    renderApp([{ path: '/page', element }], '/page')
  }

  it('in the project header', async () => {
    renderInApp(<ProjectHeader project={arabicProject} showEditButton={false} />)
    expect(await screen.findByRole('heading', { level: 1 })).toHaveAttribute('dir', 'auto')
    expectAuto(LOCATION)
  })

  it('in the project sidebar', async () => {
    renderInApp(<ProjectSidebar project={arabicProject} />)
    await screen.findAllByText(TITLE)
    expectAuto(TITLE)
    expectAuto(LOCATION)
  })

  it('in the project details card (location, component)', () => {
    render(
      <ProjectDetailsCard
        title="Project Details"
        location={LOCATION}
        component={arabicProject.project_component}
      />
    )
    expectAuto(LOCATION)
    expectAuto('تمديد الأنابيب')
  })

  it('in a Tools 3/4 grid cell, aligned to the start of the text', () => {
    render(<EditableCell value="وصف النشاط" onChange={() => {}} />)
    const cell = screen.getByText('وصف النشاط')
    expect(cell).toHaveAttribute('dir', 'auto')
    expect(cell).toHaveClass('text-start')
    expect(cell).not.toHaveClass('text-left')
  })
})
