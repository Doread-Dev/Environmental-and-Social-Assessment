/**
 * SettingsPage
 * صفحة الإعدادات - فقط Environmental Specialist يمكنه الوصول
 * Layout: MainLayout
 * Route: /app/settings
 */

import { useState } from 'react'
import { UsersManagementSection, ProjectsManagementSection } from '@/components/settings'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-3xl text-primary">settings</span>
            <h1 className="text-3xl font-bold text-text-main dark:text-white">
              Settings
            </h1>
          </div>
          <p className="text-text-secondary dark:text-gray-400 text-sm">
            Manage users and projects (Environmental Specialist only)
          </p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col gap-8">
          {/* Users Management Section */}
          <UsersManagementSection />

          {/* Projects Management Section */}
          <ProjectsManagementSection />
        </div>
      </div>
    </div>
  )
}
