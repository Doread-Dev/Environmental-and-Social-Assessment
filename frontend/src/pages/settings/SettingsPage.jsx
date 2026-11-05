/**
 * SettingsPage
 * Users (admin, manage_users) and project deletion (specialist / admin, delete_project); tabs to
 * the Activity log for admins (read_audit_log)
 * Layout: MainLayout
 * Route: /app/settings
 */

import {
  UsersManagementSection,
  ProjectsManagementSection,
  SettingsNav,
} from '@/components/settings'
import { useAuth } from '@/contexts'
import { PAGE_TITLE, PAGE_DESCRIPTION } from '@/components/ui'

export default function SettingsPage() {
  const { canManageUsers, canDeleteProject } = useAuth()

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-3xl text-primary" aria-hidden="true">
              settings
            </span>
            <h1 className={PAGE_TITLE}>Settings</h1>
          </div>
          <p className={PAGE_DESCRIPTION}>
            {canManageUsers ? 'Manage users and projects' : 'Manage projects'}
          </p>
        </div>

        <SettingsNav />

        {/* Main Content */}
        <div className="flex flex-col gap-8">
          {/* Users Management Section (admin only, D21) */}
          {canManageUsers && <UsersManagementSection />}

          {/* Projects Management Section */}
          {canDeleteProject && <ProjectsManagementSection />}
        </div>
      </div>
    </div>
  )
}
