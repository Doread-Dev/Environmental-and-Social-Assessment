import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import { authService } from '@/services/authService'

vi.mock('@/services/authService', () => ({
  authService: {
    getToken: vi.fn(),
    getUser: vi.fn(),
    isTokenValid: vi.fn(),
    logout: vi.fn(),
    login: vi.fn(),
  },
}))

function permissionsFor(role) {
  authService.getToken.mockReturnValue('token')
  authService.getUser.mockReturnValue({ _id: 'u1', role })
  authService.isTokenValid.mockReturnValue(true)
  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
  const { canEdit, canApprove, canManageUsers, canDeleteProject, canUpdateMonitoring } =
    result.current
  return { canEdit, canApprove, canManageUsers, canDeleteProject, canUpdateMonitoring }
}

const all = (value) => ({
  canEdit: value,
  canApprove: value,
  canManageUsers: value,
  canDeleteProject: value,
  canUpdateMonitoring: value,
})

describe('useAuth permission helpers', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each(['admin', 'environmental_specialist'])('%s gets every permission', (role) => {
    expect(permissionsFor(role)).toEqual(all(true))
  })

  it.each(['program_manager', 'project_manager', 'environmental_focal_point'])(
    '%s can edit but not approve, manage users or delete projects',
    (role) => {
      expect(permissionsFor(role)).toEqual({
        canEdit: true,
        canApprove: false,
        canManageUsers: false,
        canDeleteProject: false,
        canUpdateMonitoring: true,
      })
    }
  )

  it('viewer gets no write permission', () => {
    expect(permissionsFor('viewer')).toEqual(all(false))
  })
})
