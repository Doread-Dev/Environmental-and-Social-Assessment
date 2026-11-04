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
})
