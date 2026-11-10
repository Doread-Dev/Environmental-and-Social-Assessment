import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import api from '@/services/api'
import { fail, ok } from '@/test/utils'
import LoginPage from './LoginPage'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn(), post: vi.fn() },
}))

describe('LoginPage (D25)', () => {
  it('points to the system administrator instead of a "Forgot password?" link', () => {
    renderApp([{ path: '/login', element: <LoginPage /> }], '/login')

    expect(screen.getByText(/Contact your system administrator/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Forgot password/ })).not.toBeInTheDocument()
  })

  it('shows the local AKF logo and map of Syria (D51)', () => {
    renderApp([{ path: '/login', element: <LoginPage /> }], '/login')

    const logo = screen.getByRole('img', { name: 'Aga Khan Foundation logo' })
    expect(logo.getAttribute('src')).toMatch(/akf-logo/)
    expect(screen.getByRole('img', { name: 'Map of Syria' }).getAttribute('src')).toMatch(
      /syria-map/
    )
    expect(screen.getByText('Aga Khan Foundation – Syria')).toBeInTheDocument()
  })
})

describe('LoginPage form (phase 12, D76 3)', () => {
  const routes = [
    { path: '/login', element: <LoginPage /> },
    { path: '/app/dashboard', element: <p>dashboard page</p> },
  ]
  const fill = (email, password) => {
    fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: email } })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: password },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Login' }))
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('checks the fields before sending anything', async () => {
    renderApp(routes, '/login')
    fill('not-an-email', '')
    expect(await screen.findAllByText(/email|password/i)).not.toHaveLength(0)
    expect(api.post).not.toHaveBeenCalled()
  })

  it('signs in and opens the dashboard', async () => {
    const user = { _id: 'u1', name: 'Rana', role: 'project_manager' }
    api.post.mockImplementation(() => ok({ token: 'header.payload.signature', user }))
    api.get.mockImplementation(() => ok({ user, permissions: [] }))
    const { router } = renderApp(routes, '/login')
    fill('rana@example.com', 'secret-1')
    await waitFor(() => expect(router.state.location.pathname).toBe('/app/dashboard'))
    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'rana@example.com',
      password: 'secret-1',
    })
    expect(localStorage.getItem('token')).toBe('header.payload.signature')
  })

  it('shows the server error and clears it when the user types again', async () => {
    api.post.mockImplementation(() => fail(401, 'Invalid credentials'))
    renderApp(routes, '/login')
    fill('rana@example.com', 'wrong-pass')
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'wrong-pass2' },
    })
    await waitFor(() => expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument())
  })

  it('shows and hides the password', () => {
    renderApp(routes, '/login')
    const input = screen.getByPlaceholderText('Enter your password')
    expect(input).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(input).toHaveAttribute('type', 'text')
    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(input).toHaveAttribute('type', 'password')
  })
})
