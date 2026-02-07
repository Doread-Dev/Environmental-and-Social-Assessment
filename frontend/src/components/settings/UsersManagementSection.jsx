/**
 * UsersManagementSection
 * قسم إدارة المستخدمين - إضافة مستخدمين جدد
 */

import { useState, useEffect, useMemo } from 'react'
import { userService, authService } from '@/services'
import { extractErrorMessage } from '@/services/api'
import { useAuth, USER_ROLES, ROLE_LABELS } from '@/contexts'
import { useToast, Table, Badge, Pagination, Select } from '@/components/ui'
import { cn } from '@/utils/cn'

export function UsersManagementSection() {
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: USER_ROLES.PROJECT_MANAGER,
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Load users on mount
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const data = await userService.getAll()
      setUsers(data)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.password?.trim()) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter'
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter'
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsCreating(true)
    try {
      await authService.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      })

      toast.success('User created successfully')
      setShowAddForm(false)
      setFormData({
        name: '',
        email: '',
        password: '',
        role: USER_ROLES.PROJECT_MANAGER,
      })
      setErrors({})
      setShowPassword(false)
      loadUsers() // Refresh users list
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setFormData({
      name: '',
      email: '',
      password: '',
      role: USER_ROLES.PROJECT_MANAGER,
    })
    setErrors({})
    setShowPassword(false)
  }

  // Filter and search users
  const filteredUsers = useMemo(() => {
    let filtered = users

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          ROLE_LABELS[user.role]?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [users, searchQuery, roleFilter])

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredUsers.slice(start, start + itemsPerPage)
  }, [filteredUsers, currentPage, itemsPerPage])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, roleFilter])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const itemsPerPageOptions = [
    { value: '5', label: '5 per page' },
    { value: '10', label: '10 per page' },
    { value: '20', label: '20 per page' },
    { value: '30', label: '30 per page' },
    { value: '50', label: '50 per page' },
  ]

  return (
    <section className="bg-white dark:bg-[#152a1d] rounded-xl shadow-sm border border-border-default dark:border-border-dark overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border-default dark:border-border-dark bg-gray-50/50 dark:bg-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-main dark:text-white">
              Users Management
            </h2>
            <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
              Create and manage user accounts
            </p>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium text-sm shadow-md transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Add User
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Add User Form */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50/50 dark:bg-white/5 rounded-lg border border-border-default dark:border-border-dark">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2.5 text-sm',
                    'border-border-default dark:border-border-dark',
                    'bg-white dark:bg-[#102216]',
                    'text-text-main dark:text-white',
                    'focus:ring-primary focus:border-primary',
                    errors.name && 'border-red-500'
                  )}
                  placeholder="Enter user name"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">error</span>
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2.5 text-sm',
                    'border-border-default dark:border-border-dark',
                    'bg-white dark:bg-[#102216]',
                    'text-text-main dark:text-white',
                    'focus:ring-primary focus:border-primary',
                    errors.email && 'border-red-500'
                  )}
                  placeholder="user@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">error</span>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2.5 pr-10 text-sm',
                      'border-border-default dark:border-border-dark',
                      'bg-white dark:bg-[#102216]',
                      'text-text-main dark:text-white',
                      'focus:ring-primary focus:border-primary',
                      errors.password && 'border-red-500'
                    )}
                    placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary dark:text-gray-400 hover:text-text-main dark:hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">error</span>
                    {errors.password}
                  </p>
                )}
                {!errors.password && formData.password && (
                  <p className="text-xs text-text-secondary dark:text-gray-400 mt-1">
                    Password must be at least 8 characters with uppercase, lowercase, and number
                  </p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2.5 text-sm',
                    'border-border-default dark:border-border-dark',
                    'bg-white dark:bg-[#102216]',
                    'text-text-main dark:text-white',
                    'focus:ring-primary focus:border-primary'
                  )}
                >
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2.5 rounded-lg border border-border-default dark:border-border-dark text-text-main dark:text-white font-medium hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">check</span>
                    Create User
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Search and Filter Bar */}
        {!isLoading && users.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary dark:text-gray-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or role..."
                className={cn(
                  'w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm',
                  'border-border-default dark:border-border-dark',
                  'bg-white dark:bg-[#102216]',
                  'text-text-main dark:text-white',
                  'focus:ring-primary focus:border-primary',
                  'placeholder:text-text-secondary dark:placeholder:text-gray-500'
                )}
              />
            </div>

            {/* Role Filter */}
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={cn(
                  'w-full rounded-lg border px-3 py-2.5 text-sm',
                  'border-border-default dark:border-border-dark',
                  'bg-white dark:bg-[#102216]',
                  'text-text-main dark:text-white',
                  'focus:ring-primary focus:border-primary'
                )}
              >
                <option value="all">All Roles</option>
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Users Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-text-secondary dark:text-gray-400 text-sm">Loading users...</p>
            </div>
          </div>
        ) : (
          <div className="border border-border-default dark:border-border-dark rounded-lg overflow-hidden">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Name</Table.Head>
                  <Table.Head>Email</Table.Head>
                  <Table.Head>Role</Table.Head>
                  <Table.Head>Status</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {paginatedUsers.length === 0 ? (
                  <Table.Empty
                    message={
                      searchQuery || roleFilter !== 'all'
                        ? 'No users match your filters'
                        : 'No users found'
                    }
                  />
                ) : (
                  paginatedUsers.map((user) => (
                    <Table.Row key={user._id}>
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-sm">
                              person
                            </span>
                          </div>
                          <span className="font-medium text-text-main dark:text-white">
                            {user.name}
                          </span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-text-secondary dark:text-gray-400">{user.email}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          variant={
                            user.role === USER_ROLES.ENVIRONMENTAL_SPECIALIST
                              ? 'success'
                              : user.role === USER_ROLES.PROGRAM_MANAGER
                                ? 'info'
                                : 'default'
                          }
                        >
                          {ROLE_LABELS[user.role] || user.role}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge variant={user.is_active ? 'success' : 'warning'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
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
                options={itemsPerPageOptions}
                size="sm"
                className="w-[160px]"
                selectClassName="h-9 text-sm pl-3 pr-8"
              />
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        )}
      </div>
    </section>
  )
}
