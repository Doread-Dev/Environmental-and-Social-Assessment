/**
 * ChangePasswordForm
 * Current + new password (D23), used by the Profile page and the forced change screen (D22).
 * The password policy comes from the backend (GET /auth/me password_rules); the backend also
 * enforces it, so the form only adds what it can check locally (confirmation, minimum length).
 */
import { useState } from 'react'
import { Button, Input, Icon } from '@/components/ui'
import { useAuth } from '@/contexts'
import { extractErrorMessage } from '@/services/api'

const EMPTY = { current: '', next: '', confirm: '' }

export function ChangePasswordForm({ onSuccess, submitLabel = 'Change Password' }) {
  const { changePassword, passwordRules } = useAuth()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const minLength = passwordRules?.min_length

  const set = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: null }))
    setServerError('')
  }

  const validate = () => {
    const next = {}
    if (!values.current) next.current = 'Current password is required'
    if (!values.next) next.next = 'New password is required'
    else if (minLength && values.next.length < minLength) {
      next.next = `Password must be at least ${minLength} characters`
    } else if (values.next === values.current) {
      next.next = 'New password must be different from the current password'
    }
    if (values.confirm !== values.next) next.confirm = 'Passwords do not match'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setIsSaving(true)
    try {
      await changePassword(values.current, values.next)
      setValues(EMPTY)
      onSuccess?.()
    } catch (err) {
      setServerError(extractErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {serverError && (
        <p role="alert" className="text-sm text-error flex items-center gap-1">
          <Icon name="error" className="text-base" />
          {serverError}
        </p>
      )}
      <Input
        label="Current password"
        type="password"
        autoComplete="current-password"
        value={values.current}
        onChange={set('current')}
        error={errors.current}
        required
        disabled={isSaving}
      />
      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        value={values.next}
        onChange={set('next')}
        error={errors.next}
        helperText={minLength ? `At least ${minLength} characters` : undefined}
        required
        disabled={isSaving}
      />
      <Input
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        value={values.confirm}
        onChange={set('confirm')}
        error={errors.confirm}
        required
        disabled={isSaving}
      />
      <div className="flex justify-end">
        <Button type="submit" isLoading={isSaving} leftIcon={<Icon name="lock_reset" />}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

export default ChangePasswordForm
