/**
 * SettingsPage
 * Users (admin, manage_users) and project deletion (specialist / admin, delete_project)
 * Layout: MainLayout
 * Route: /app/settings
 */

import { UsersManagementSection, ProjectsManagementSection } from '@/components/settings'
import { useAuth } from '@/contexts'

export default function SettingsPage() {
  const { canManageUsers, canDeleteProject } = useAuth()

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-3xl text-primary">settings</span>
            <h1 className="text-3xl font-bold text-text-main dark:text-white">Settings</h1>
          </div>
          <p className="text-text-secondary dark:text-gray-400 text-sm">
            {canManageUsers ? 'Manage users and projects' : 'Manage projects'}
          </p>
        </div>

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
