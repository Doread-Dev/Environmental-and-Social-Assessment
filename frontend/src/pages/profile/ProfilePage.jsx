import { Card, Icon, useToast } from '@/components/ui'
import { ChangePasswordForm } from '@/components/auth'
import { useAuth, ROLE_LABELS } from '@/contexts'

/**
 * ProfilePage - own account details and password change (D23)
 * Layout: MainLayout. Route: /app/profile (every role)
 */
export default function ProfilePage() {
  const toast = useToast()
  const { user } = useAuth()

  const details = [
    ['Name', user?.name],
    ['Email', user?.email],
    ['Role', ROLE_LABELS[user?.role] || user?.role],
    ['Job title', user?.job_title?.title_name],
  ]

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Icon name="person" className="text-3xl text-primary" />
            <h1 className="text-3xl font-bold text-text-main dark:text-white">Profile</h1>
          </div>
          <p className="text-text-secondary dark:text-gray-400 text-sm">
            Your account details and password
          </p>
        </div>

        <Card>
          <Card.Header>
            <Card.Title>Account</Card.Title>
            <Card.Description>Contact your system administrator to change these</Card.Description>
          </Card.Header>
          <Card.Body>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-medium uppercase text-text-secondary dark:text-gray-400">
                    {label}
                  </dt>
                  <dd className="text-sm text-text-main dark:text-white mt-1">
                    {value || 'Not specified'}
                  </dd>
                </div>
              ))}
            </dl>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Change password</Card.Title>
          </Card.Header>
          <Card.Body>
            <ChangePasswordForm onSuccess={() => toast.success('Password changed')} />
          </Card.Body>
        </Card>
      </div>
    </div>
  )
}
