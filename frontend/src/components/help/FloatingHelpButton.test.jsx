import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import api from '@/services/api'
import MainLayout from '@/components/layout/MainLayout'
import AuthLayout from '@/components/layout/AuthLayout'
import { StickyFooter } from '@/components/ui'
import { ROUTES } from '@/routes/routes.config'
import { HELP_SECTIONS, helpSectionsFor } from '@/routes/helpSections'
import { lookupsFixture, mockGet, signIn } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn() },
}))

const at = (route) => route.replace(':projectId', 'p1')

// The pages the owner listed (phase 14 review): every one opens a part of the guide
const PAGES = [
  ROUTES.DASHBOARD,
  ROUTES.PROJECTS,
  ROUTES.PROJECT_NEW,
  ROUTES.PROJECT_OVERVIEW,
  ROUTES.SCREENING,
  ROUTES.SCREENING_SUMMARY,
  ROUTES.ASSESSMENT,
  ROUTES.ASSESSMENT_METADATA,
  ROUTES.ASSESSMENT_METHODS,
  ROUTES.ASSESSMENT_SCORING,
  ROUTES.ASSESSMENT_REVIEW,
  ROUTES.SEMP,
  ROUTES.SEMP_ACTIVITIES,
  ROUTES.SEMP_MITIGATION,
  ROUTES.MONITORING,
  ROUTES.MONITORING_DATA,
  ROUTES.PROJECT_DOCUMENTS,
  ROUTES.LIBRARY,
  ROUTES.SETTINGS,
  ROUTES.SETTINGS_ACTIVITY_LOG,
  ROUTES.PROFILE,
  ROUTES.CHANGE_PASSWORD,
]

describe('page → guide section map (routes/helpSections.js)', () => {
  it('has guide sections for every listed page, and none for sign-in and Help', () => {
    for (const route of PAGES) expect(helpSectionsFor(at(route)), route).not.toBeNull()
    expect(helpSectionsFor(ROUTES.LOGIN)).toBeNull()
    expect(helpSectionsFor(ROUTES.HELP)).toBeNull()
    expect(helpSectionsFor('/app/unknown')).toBeNull()
  })

  it('opens the page section, most specific first, and ignores a trailing slash', () => {
    expect(helpSectionsFor('/app/projects/p1/assessment/scoring/')).toEqual([
      'assessment-scoring',
      'assessment',
    ])
    expect(helpSectionsFor('/app/projects/new')).toEqual(['project-create', 'project-list'])
    expect(helpSectionsFor('/app/projects/p1/semp/mitigation')).toEqual(['mitigation'])
  })

  it('lists each page once, keyed by ROUTES constants', () => {
    const patterns = HELP_SECTIONS.map(([pattern]) => pattern)
    expect(new Set(patterns).size).toBe(patterns.length)
    expect(patterns.every((pattern) => Object.values(ROUTES).includes(pattern))).toBe(true)
  })
})

describe('floating Help button in the layouts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    signIn()
    mockGet(api, {
      '/auth/me': { user: { _id: 'u1', name: 'Rana', role: 'project_manager' }, permissions: [] },
      '/lookups': lookupsFixture(),
    })
  })

  const mainPage = (path) =>
    renderApp(
      [{ path: '/app', element: <MainLayout />, children: [{ path: '*', element: <p>page</p> }] }],
      path
    )

  it.each([
    ROUTES.DASHBOARD,
    ROUTES.PROJECTS,
    ROUTES.PROJECT_NEW,
    ROUTES.LIBRARY,
    ROUTES.SETTINGS,
    ROUTES.SETTINGS_ACTIVITY_LOG,
    ROUTES.PROFILE,
  ])('is on %s (one button, mounted by the layout)', async (path) => {
    mainPage(path)
    await screen.findByText('page')
    expect(screen.getAllByRole('button', { name: 'Help for this page' })).toHaveLength(1)
  })

  it('is not on the Help page', async () => {
    mainPage(ROUTES.HELP)
    await screen.findByText('page')
    expect(screen.queryByRole('button', { name: 'Help for this page' })).toBeNull()
  })

  it('is on the forced password change, not on sign-in', async () => {
    const authPage = (path) =>
      renderApp(
        [{ element: <AuthLayout />, children: [{ path, element: <p>auth page</p> }] }],
        path
      )
    const first = authPage(ROUTES.CHANGE_PASSWORD)
    await screen.findByText('auth page')
    expect(screen.getByRole('button', { name: 'Help for this page' })).toBeInTheDocument()
    first.unmount()

    authPage(ROUTES.LOGIN)
    await screen.findByText('auth page')
    expect(screen.queryByRole('button', { name: 'Help for this page' })).toBeNull()
  })

  it('sits below dialogs, menus and toasts (z-30) and is left out of print', async () => {
    mainPage(ROUTES.DASHBOARD)
    const button = await screen.findByRole('button', { name: 'Help for this page' })
    expect(button.className.split(' ')).toContain('z-30')
    expect(button).toHaveAttribute('data-print', 'hide')
  })
})

describe('save bars lift the floating Help button', () => {
  it('sets the offset while a StickyFooter is shown and clears it after the last one', () => {
    const offset = () => document.documentElement.style.getPropertyValue('--floating-help-bottom')
    const first = render(<StickyFooter>one</StickyFooter>)
    const second = render(<StickyFooter>two</StickyFooter>)
    expect(offset()).toBe('5rem')
    first.unmount()
    expect(offset()).toBe('5rem')
    second.unmount()
    expect(offset()).toBe('')
  })
})
