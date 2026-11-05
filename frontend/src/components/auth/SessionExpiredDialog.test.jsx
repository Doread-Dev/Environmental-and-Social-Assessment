/**
 * Session expired mid-edit (D73): a 401 while a user is signed in opens a sign-in dialog over the
 * page; nothing typed is lost, writes are not retried on their own, "Sign in as someone else" ends
 * the session. A 401 with no user loaded still goes to the login page.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import api, { setSessionExpiredHandler } from '@/services/api'
import SempFullWidthLayout from '@/components/layout/SempFullWidthLayout'
import ManagementActivitiesPage from '@/pages/project-workspace/semp/ManagementActivitiesPage'
import { lookupsFixture, signIn, workspaceFixture } from '@/test/utils'
import { renderApp } from '@/test/renderApp'
import { resetLeaveGuard } from '@/utils/leaveGuard'

// The HTTP methods are mocked; the real response interceptor (api.js) is kept, so a 401 goes
// through the same code as in the app.
vi.mock('@/services/api', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    default: {
      get: vi.fn(),
      put: vi.fn(),
      post: vi.fn(),
      interceptors: actual.default.interceptors,
    },
  }
})

const interceptor = () => api.interceptors.response.handlers[0].rejected
const httpError = (status, error, url) =>
  Object.assign(new Error(error), {
    response: { status, data: { success: false, error } },
    config: { url },
  })
// A request answered 401, handled by the app's interceptor
const unauthorized = (url) => interceptor()(httpError(401, 'Not authorized, token failed', url))

const user = { _id: 'u1', name: 'Rana', email: 'rana@example.com', role: 'project_manager' }
const ok = (data, extra = {}) => Promise.resolve({ data: { success: true, data, ...extra } })

const routes = [
  {
    path: '/app/projects/:projectId/semp',
    element: <SempFullWidthLayout />,
    children: [{ path: 'activities', element: <ManagementActivitiesPage /> }],
  },
  { path: '/login', element: <p>Login page</p> },
]

function mockReads({ meFails = false } = {}) {
  api.get.mockImplementation((url) => {
    if (url === '/auth/me') {
      return meFails ? unauthorized(url) : ok({ user, permissions: ['edit'] })
    }
    if (url === '/projects/p1/workspace') {
      return ok(
        workspaceFixture({
          allowed_actions: ['semp.edit'],
          steps: {
            screening: { tool: 1, status: 'approved' },
            assessment: { tool: 2, status: 'approved' },
            semp: {
              tools: [3, 4],
              status: 'in_progress',
              management_activities: { count: 1, described: 1, status: 'completed' },
              mitigation_plans: { count: 0, described: 0, status: 'not_started' },
            },
          },
        })
      )
    }
    if (url === '/management/project/p1') {
      return ok([{ _id: 'r1', serial_number: 1, activity_description: 'Dig' }], { version: 3 })
    }
    if (url === '/lookups') return ok(lookupsFixture())
    if (url === '/users' || url === '/library') return ok([])
    return Promise.reject(httpError(404, `No mock for GET ${url}`, url))
  })
}

const firstCell = () => document.querySelector('[contenteditable="true"]')

async function editAndSave() {
  mockReads()
  api.put.mockImplementation((url) => unauthorized(url))
  const app = renderApp(routes, '/app/projects/p1/semp/activities')
  await waitFor(() => expect(firstCell()).not.toBeNull())
  const cell = firstCell()
  cell.textContent = 'Dig deeper'
  fireEvent.input(cell)
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await screen.findByRole('dialog', { name: 'Your session has expired' })
  return app
}

describe('session expired mid-edit (D73)', () => {
  let location
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    resetLeaveGuard()
    signIn({ user })
    location = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...location, pathname: '/app/projects/p1/semp/activities', assign: vi.fn() },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: location })
    setSessionExpiredHandler(null)
  })

  it('a 401 opens the sign-in dialog over the page and keeps what was typed', async () => {
    await editAndSave()

    expect(screen.getByLabelText('Email')).toHaveValue('rana@example.com')
    expect(screen.getByLabelText('Email')).toHaveAttribute('readonly')
    expect(firstCell()).toHaveTextContent('Dig deeper')
    // No redirect to the login page, the session is not cleared
    expect(window.location.assign).not.toHaveBeenCalled()
    expect(localStorage.getItem('token')).not.toBeNull()
  })

  it('signing in closes the dialog; the save is not retried on its own; Save again works', async () => {
    await editAndSave()
    api.post.mockImplementation(() => ok({ user, token: 'new-token' }))

    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Your session has expired' })).toBeNull()
    )
    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'rana@example.com',
      password: 'secret',
    })
    expect(localStorage.getItem('token')).toBe('new-token')
    expect(api.put).toHaveBeenCalledTimes(1) // no automatic retry
    expect(firstCell()).toHaveTextContent('Dig deeper')

    api.put.mockImplementation((url, body) => ok(body.rows, { version: 4 }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(api.put).toHaveBeenCalledTimes(2))
    expect(api.put.mock.calls[1][1]).toMatchObject({ version: 3 })
  })

  it('a wrong password says so and keeps the dialog open', async () => {
    await editAndSave()
    api.post.mockImplementation(() =>
      Promise.reject(httpError(401, 'Invalid email or password', '/auth/login'))
    )

    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password')
    expect(screen.getByRole('dialog', { name: 'Your session has expired' })).toBeInTheDocument()
  })

  it('a deactivated account shows "Account is deactivated" in the dialog', async () => {
    await editAndSave()
    api.post.mockImplementation(() =>
      Promise.reject(httpError(403, 'Account is deactivated', '/auth/login'))
    )

    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Account is deactivated')
  })

  it('"Sign in as someone else" logs out, clears the cache and opens the login page', async () => {
    const { queryClient } = await editAndSave()
    const clear = vi.spyOn(queryClient, 'clear')

    fireEvent.click(screen.getByRole('button', { name: 'Sign in as someone else' }))

    expect(window.location.assign).toHaveBeenCalledWith('/login')
    expect(localStorage.getItem('token')).toBeNull()
    expect(clear).toHaveBeenCalled()
  })

  it('a 401 with no user loaded (first load, bad token) still goes to the login page', async () => {
    mockReads({ meFails: true })
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/app/dashboard', search: '', href: '/app/dashboard', assign: vi.fn() },
    })
    renderApp(routes, '/app/projects/p1/semp/activities')

    await waitFor(() => expect(window.location.href).toBe('/login'))
    expect(screen.queryByRole('dialog', { name: 'Your session has expired' })).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
  })
})
