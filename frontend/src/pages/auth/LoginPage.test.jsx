import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
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
