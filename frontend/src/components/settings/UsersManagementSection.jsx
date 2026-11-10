/**
 * UsersManagementSection
 * Admin user management (D21, D22): list with active/inactive filter, create, edit (name, role,
 * job title), deactivate/reactivate, reset password (temporary password shown once).
 * Which roles exist and the password policy come from the backend: the role list here is for
 * display only, and new accounts get a server-generated temporary password.
 */

import { useState, useEffect, useMemo } from 'react'
import { extractErrorMessage } from '@/services/api'
import { useUsers, useUserManagement } from '@/hooks'
import { useAuth, USER_ROLES, ROLE_LABELS } from '@/contexts'
import {
  useToast,
  Table,
  Badge,
  Pagination,
  Select,
  Button,
  Icon,
  Input,
  LoadingState,
} from '@/components/ui'
import { cn } from '@/utils/cn'
import { UserFormModal } from './UserFormModal'
import { TemporaryPasswordModal } from './TemporaryPasswordModal'
import { ConfirmUserActionModal } from './ConfirmUserActionModal'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active users' },
  { value: 'inactive', label: 'Inactive users' },
  { value: 'all', label: 'All users' },
]

const ROLE_OPTIONS = [
  { value: 'all', label: 'All roles' },
  ...Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })),
]

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 30, 50].map((n) => ({
  value: String(n),
  label: `${n} per page`,
}))

const roleBadge = (role) =>
  role === USER_ROLES.ENVIRONMENTAL_SPECIALIST || role === USER_ROLES.ADMIN
    ? 'success'
    : role === USER_ROLES.PROGRAM_MANAGER
      ? 'info'
      : 'default'

function ActionButton({ icon, label, onClick, disabled, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        'text-text-secondary dark:text-gray-400 hover:bg-background dark:hover:bg-background-dark',
        danger ? 'hover:text-error' : 'hover:text-primary'
      )}
    >
      <Icon name={icon} className="text-lg" />
    </button>
  )
}

export function UsersManagementSection() {
  const toast = useToast()
  const { user: currentUser } = useAuth()
  const { users, isLoading, error: loadError } = useUsers()
  const { createUser, updateUser, deactivateUser, reactivateUser, resetPassword, isSaving } =
    useUserManagement()

  // null = closed, {} = create, { user } = edit
  const [form, setForm] = useState(null)
  // { user, password } while the one-time password is shown
  const [temporary, setTemporary] = useState(null)
  // { action: 'deactivate' | 'reset', user } while asking for confirmation
  const [confirming, setConfirming] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('active')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    if (loadError) toast.error(loadError)
  }, [loadError, toast])

  const handleSubmit = async (data) => {
    try {
      if (form.user) {
        await updateUser(form.user._id, data)
        toast.success('User updated')
      } else {
        const result = await createUser(data)
        toast.success('User created')
        setTemporary({ user: result.user, password: result.temporary_password })
      }
      setForm(null)
      return { success: true }
    } catch (err) {
      toast.error(extractErrorMessage(err))
      return { success: false }
    }
  }

  const setActive = async (user, active) => {
    try {
      if (active) await reactivateUser(user._id)
      else await deactivateUser(user._id)
      toast.success(active ? 'User reactivated' : 'User deactivated')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const reset = async (user) => {
    try {
      const result = await resetPassword(user._id)
      setTemporary({ user: result.user, password: result.temporary_password })
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  // Deactivate and reset ask first, in an in-app dialog: window.confirm is suppressed by some
  // browsers and embedded views, which made these buttons silently do nothing.
  const handleToggleActive = (user) => {
    if (user.is_active) setConfirming({ action: 'deactivate', user })
    else setActive(user, true)
  }

  const handleResetPassword = (user) => setConfirming({ action: 'reset', user })

  const handleConfirm = async () => {
    const { action, user } = confirming
    setConfirming(null)
    if (action === 'deactivate') await setActive(user, false)
    else await reset(user)
  }

  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return users.filter((user) => {
      if (statusFilter === 'active' && !user.is_active) return false
      if (statusFilter === 'inactive' && user.is_active) return false
      if (roleFilter !== 'all' && user.role !== roleFilter) return false
      if (!query) return true
      return (
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        ROLE_LABELS[user.role]?.toLowerCase().includes(query)
      )
    })
  }, [users, searchQuery, roleFilter, statusFilter])

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredUsers.slice(start, start + itemsPerPage)
  }, [filteredUsers, currentPage, itemsPerPage])

  // Back to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, roleFilter, statusFilter])

  return (
    <section className="bg-surface dark:bg-surface-dark rounded-xl shadow-sm border border-border-default dark:border-border-dark overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border-default dark:border-border-dark">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-text-main dark:text-white">Users Management</h2>
            <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
              Create accounts, change roles, deactivate users and reset passwords
            </p>
          </div>
          <Button onClick={() => setForm({})} leftIcon={<Icon name="add" />}>
            Add User
          </Button>
        </div>
      </div>

      <div className="p-6">
        {/* Search and filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <Input
            className="flex-1"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or role..."
            aria-label="Search users"
            leftIcon={<Icon name="search" />}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Status filter"
            options={STATUS_OPTIONS}
            className="sm:w-44"
          />
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Role filter"
            options={ROLE_OPTIONS}
            className="sm:w-56"
          />
        </div>

        {/* Users table */}
        {isLoading ? (
          <LoadingState message="Loading users..." variant="section" />
        ) : (
          <div className="border border-border-default dark:border-border-dark rounded-lg overflow-hidden">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Name</Table.Head>
                  <Table.Head>Email</Table.Head>
                  <Table.Head>Role</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="text-right">Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {paginatedUsers.length === 0 ? (
                  <Table.Empty
                    message={users.length ? 'No users match your filters' : 'No users found'}
                  />
                ) : (
                  paginatedUsers.map((user) => (
                    <Table.Row key={user._id}>
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span
                              className="material-symbols-outlined text-primary text-sm"
                              aria-hidden="true"
                            >
                              person
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-text-main dark:text-white">
                              {user.name}
                              {user._id === currentUser?._id && (
                                <span className="ml-2 text-xs text-text-secondary dark:text-gray-400">
                                  (you)
                                </span>
                              )}
                            </span>
                            {user.job_title?.title_name && (
                              <span className="text-xs text-text-secondary dark:text-gray-400">
                                {user.job_title.title_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-text-secondary dark:text-gray-400">{user.email}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge variant={roleBadge(user.role)}>
                          {ROLE_LABELS[user.role] || user.role}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant={user.is_active ? 'success' : 'warning'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {user.must_change_password && (
                            <Badge variant="info">Password change pending</Badge>
                          )}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center justify-end gap-1">
                          <ActionButton
                            icon="edit"
                            label={`Edit ${user.name}`}
                            onClick={() => setForm({ user })}
                            disabled={isSaving}
                          />
                          {/* The own account: password in the profile, no self deactivation
                              (v2.0.1; the backend refuses both with 409) */}
                          {user._id !== currentUser?._id && (
                            <>
                              <ActionButton
                                icon="lock_reset"
                                label={`Reset password of ${user.name}`}
                                onClick={() => handleResetPassword(user)}
                                disabled={isSaving}
                              />
                              <ActionButton
                                icon={user.is_active ? 'person_off' : 'person_check'}
                                label={`${user.is_active ? 'Deactivate' : 'Reactivate'} ${user.name}`}
                                onClick={() => handleToggleActive(user)}
                                disabled={isSaving}
                                danger={user.is_active}
                              />
                            </>
                          )}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && filteredUsers.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-sm text-text-secondary dark:text-gray-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of{' '}
                {filteredUsers.length} results
              </p>
              <Select
                value={String(itemsPerPage)}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                options={ITEMS_PER_PAGE_OPTIONS}
                size="sm"
                className="w-[160px]"
              />
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        )}
      </div>

      {form && (
        <UserFormModal
          user={form.user}
          isSelf={!!form.user && form.user._id === currentUser?._id}
          onClose={() => setForm(null)}
          onSubmit={handleSubmit}
          isSaving={isSaving}
        />
      )}
      {confirming && (
        <ConfirmUserActionModal
          action={confirming.action}
          user={confirming.user}
          onConfirm={handleConfirm}
          onClose={() => setConfirming(null)}
        />
      )}
      {temporary && (
        <TemporaryPasswordModal
          user={temporary.user}
          password={temporary.password}
          onClose={() => setTemporary(null)}
        />
      )}
    </section>
  )
}
