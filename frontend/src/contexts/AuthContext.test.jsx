import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import api from '@/services/api'
import { AuthProvider } from './AuthContext'
import { useAuth } from './useAuth'
import { createTestQueryClient, mockGet, signIn } from '@/test/utils'
import { QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn(), post: vi.fn() },
}))

function renderAuth(permissions) {
  mockGet(api, { '/auth/me': { user: { _id: 'u1', name: 'Rana', role: 'x' }, permissions } })
  const queryClient = createTestQueryClient()
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
  return { ...renderHook(() => useAuth(), { wrapper }), queryClient }
}

describe('useAuth permissions come from GET /auth/me (D35)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('waits for the permissions, then exposes them', async () => {
    signIn()
    const { result } = renderAuth([
      'edit',
      'export',
      'approve',
      'manage_users',
      'delete_project',
      'manage_library',
    ])

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current).toMatchObject({
      isAuthenticated: true,
      canEdit: true,
      canExport: true,
      canApprove: true,
      canManageUsers: true,
      canDeleteProject: true,
      canManageLibrary: true,
    })
    expect(result.current.can('purge_project')).toBe(false)
    expect(result.current.user.name).toBe('Rana')
  })

  it('a viewer (no permissions) can do nothing but read', async () => {
    signIn()
    const { result } = renderAuth([])

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current).toMatchObject({
      canEdit: false,
      canExport: false,
      canApprove: false,
      canManageUsers: false,
      canCreateProject: false,
      canManageLibrary: false,
    })
  })

  it('signed out: no request, no permissions', () => {
    const { result } = renderAuth(['edit'])

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(api.get).not.toHaveBeenCalled()
  })

  it('an expired token is dropped on start', () => {
    signIn({ expiresIn: -60 })
    const { result } = renderAuth(['edit'])

    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('logout clears the cached data of the previous user', async () => {
    signIn()
    const { result, queryClient } = renderAuth(['edit'])
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    queryClient.setQueryData(['workspace', 'p1'], { project: {} })

    act(() => result.current.logout())

    expect(result.current.isAuthenticated).toBe(false)
    expect(queryClient.getQueryData(['workspace', 'p1'])).toBeUndefined()
    expect(localStorage.getItem('token')).toBeNull()
  })
})
