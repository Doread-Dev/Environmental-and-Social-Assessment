import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import { Outlet } from 'react-router-dom'
import api from '@/services/api'
import SempOverviewPage from '@/pages/project-workspace/semp/SempOverviewPage'
import { V3_LOCKED_LOCATIONS, V3_LOCKED_NAV } from '@/routes/routes.config'
import { lookupsFixture, mockGet, signIn, workspaceFixture } from '@/test/utils'
import { renderApp } from '@/test/renderApp'
import MainSidebar from './MainSidebar'
import MobileMenu from './MobileMenu'
import ProjectSidebar from './ProjectSidebar'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn() },
}))

const noop = () => {}

// Permissions of /auth/me per role (the buttons depend on none of them)
const ROLE_PERMISSIONS = {
  admin: ['create_project', 'edit', 'export', 'approve', 'manage_users', 'delete_project'],
  viewer: [],
}

function signInAs(role) {
  const user = { _id: 'u1', name: 'Rana', role }
  signIn({ user })
  mockGet(api, { '/auth/me': { user, permissions: ROLE_PERMISSIONS[role] } })
}

const workspace = workspaceFixture()
const project = { ...workspace.project, workflow: workspace.workflow }

const routes = [
  {
    path: '/app/dashboard',
    element: (
      <>
        <MainSidebar />
        <MobileMenu isOpen variant="main" onClose={noop} />
      </>
    ),
  },
  {
    path: '/app/projects/:projectId',
    element: <Outlet context={{ project, workflow: workspace.workflow, can: () => false }} />,
    children: [
      {
        path: 'overview',
        element: (
          <>
            <ProjectSidebar project={project} />
            <MobileMenu isOpen variant="project" onClose={noop} project={project} />
          </>
        ),
      },
      { path: 'semp', element: <SempOverviewPage /> },
    ],
  },
]

const itemsAt = (location) => V3_LOCKED_NAV.filter((item) => item.location === location)

// A locked button: a focusable button, not a link, that goes nowhere
async function expectLocked(router, button) {
  expect(button.tagName).toBe('BUTTON')
  expect(button).toHaveAttribute('aria-disabled', 'true')
  expect(button).not.toHaveAttribute('href')
  expect(button.closest('a')).toBeNull()
  expect(button).toHaveAccessibleDescription(/Available in v3/)

  button.focus()
  expect(button).toHaveFocus()

  const before = router.state.location.pathname
  fireEvent.click(button)
  fireEvent.keyDown(button, { key: 'Enter' })
  expect(router.state.location.pathname).toBe(before)
}

describe('locked v3 buttons (D48, D70)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('describes the four v3 modules by their locked place keys', () => {
    const lockedPlaces = lookupsFixture()
      .places.filter((place) => place.locked)
      .map((place) => place.key)
    expect(V3_LOCKED_NAV.map((item) => item.place).sort()).toEqual([...lockedPlaces].sort())
    expect(V3_LOCKED_NAV.map((item) => [item.label, item.location])).toEqual([
      ['SEMP Plan', 'semp_overview'],
      ['Stakeholder Awareness', 'project_support'],
      ['GHG Emissions', 'organization'],
      ['Environmental Data Collection', 'organization'],
    ])
    for (const item of V3_LOCKED_NAV) {
      expect(item.icon, item.id).toMatch(/^[a-z0-9_]+$/)
      expect(item, item.id).not.toHaveProperty('path')
    }
  })

  it.each(['admin', 'viewer'])(
    'the main sidebar and the mobile menu show the organization tools (%s)',
    async (role) => {
      signInAs(role)
      const { router } = renderApp(routes, '/app/dashboard')

      const [sidebar, mobile] = await screen.findAllByRole('group', { name: 'Organization tools' })
      expect(sidebar.closest('aside')).not.toBeNull()
      expect(within(screen.getByRole('dialog')).getByRole('group')).toBe(mobile)

      for (const group of [sidebar, mobile]) {
        const buttons = within(group).getAllByRole('button')
        expect(buttons.map((b) => b.textContent)).toEqual(
          itemsAt(V3_LOCKED_LOCATIONS.ORGANIZATION).map((item) =>
            expect.stringContaining(item.label)
          )
        )
        for (const button of buttons) await expectLocked(router, button)
        expect(within(group).queryAllByRole('link')).toEqual([])
      }
    }
  )

  it.each(['admin', 'viewer'])(
    'the project sidebar and its mobile menu show Stakeholder Awareness (%s)',
    async (role) => {
      signInAs(role)
      const { router } = renderApp(routes, '/app/projects/p1/overview')

      const groups = await screen.findAllByRole('group', { name: 'Project support tools' })
      expect(groups).toHaveLength(2)
      for (const group of groups) {
        const button = within(group).getByRole('button', { name: 'Stakeholder Awareness' })
        await expectLocked(router, button)
      }
      expect(screen.queryByRole('group', { name: 'Organization tools' })).toBeNull()
    }
  )

  it.each(['admin', 'viewer'])(
    'the SEMP overview shows the SEMP Plan card instead of "Coming soon" (%s)',
    async (role) => {
      signInAs(role)
      const { router } = renderApp(routes, '/app/projects/p1/semp')

      const button = await screen.findByRole('button', { name: 'SEMP Plan' })
      expect(button).toHaveAccessibleDescription(/Available in v3.*Management Plan document/)
      await expectLocked(router, button)
      expect(screen.queryByText('Coming soon')).toBeNull()
    }
  )
})
