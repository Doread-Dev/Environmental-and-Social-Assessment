/**
 * UserFormModal
 * Create a user (name, email, role, job title) or edit one (name, role, job title; D21).
 * No password field: the backend generates a temporary one on create (D22).
 */
import { useRef, useState } from 'react'
import { Modal, Button, Input, Select } from '@/components/ui'
import { ROLE_LABELS, USER_ROLES, useUnsavedChanges } from '@/contexts'
import { useLookups } from '@/hooks'

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))

const initialValues = (user) => ({
  name: user?.name ?? '',
  email: user?.email ?? '',
  role: user?.role ?? USER_ROLES.PROJECT_MANAGER,
  job_title: user?.job_title?._id ?? user?.job_title ?? '',
})

export function UserFormModal({ user, onClose, onSubmit, isSaving }) {
  const isEdit = !!user
  const { jobTitles } = useLookups()
  const [values, setValues] = useState(() => initialValues(user))
  const [errors, setErrors] = useState({})
  // One request per click: a double click on "Create User" creates one account
  const submitting = useRef(false)
  const initial = initialValues(user)
  const isDirty = Object.keys(initial).some((field) => values[field] !== initial[field])

  const set = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: null }))
  }

  const submit = async () => {
    const next = {}
    if (!values.name.trim()) next.name = 'Name is required'
    if (!isEdit && !values.email.trim()) next.email = 'Email is required'
    setErrors(next)
    if (Object.keys(next).length) return { success: false }
    if (submitting.current) return { success: false }

    const data = {
      name: values.name.trim(),
      role: values.role,
      job_title: values.job_title || null,
      ...(!isEdit && { email: values.email.trim() }),
    }
    submitting.current = true
    try {
      return (await onSubmit(data)) ?? { success: true }
    } finally {
      submitting.current = false
    }
  }

  // Leaving Settings with changes in this form asks first (D61). Editing: Save / Discard / Stay.
  // Creating: Discard / Stay only, because the new account's one-time password must be seen here.
  useUnsavedChanges(isDirty, isEdit ? submit : null)

  const handleSubmit = (e) => {
    e.preventDefault()
    submit()
  }

  const jobTitleOptions = [
    { value: '', label: 'None' },
    ...jobTitles.map((jt) => ({ value: jt._id, label: jt.title_name })),
  ]

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? 'Edit User' : 'Add User'} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Name"
          value={values.name}
          onChange={set('name')}
          error={errors.name}
          required
          disabled={isSaving}
        />
        <Input
          label="Email"
          type="email"
          value={values.email}
          onChange={set('email')}
          error={errors.email}
          helperText={isEdit ? 'The email cannot be changed' : 'Used to sign in'}
          required={!isEdit}
          disabled={isEdit || isSaving}
        />
        <Select
          label="Role"
          value={values.role}
          onChange={set('role')}
          options={ROLE_OPTIONS}
          placeholder={null}
          required
          disabled={isSaving}
        />
        <Select
          label="Job title"
          value={values.job_title}
          onChange={set('job_title')}
          options={jobTitleOptions}
          placeholder={null}
          disabled={isSaving}
        />
        {!isEdit && (
          <p className="text-sm text-text-secondary dark:text-gray-400">
            A temporary password is generated and shown once. The user must change it at first
            sign-in.
          </p>
        )}
        <Modal.Footer className="mt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            {isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}

export default UserFormModal
