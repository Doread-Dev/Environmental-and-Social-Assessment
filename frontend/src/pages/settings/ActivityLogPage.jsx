/**
 * ActivityLogPage
 * Settings → Activity log: the critical-actions log (D65), admin only (read_audit_log)
 * Layout: MainLayout
 * Route: /app/settings/activity-log
 */

import { ActivityLogSection, SettingsNav } from '@/components/settings'

export default function ActivityLogPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-3xl text-primary">settings</span>
            <h1 className="text-3xl font-bold text-text-main dark:text-white">Settings</h1>
          </div>
          <p className="text-text-secondary dark:text-gray-400 text-sm">
            Who did which critical action, and when
          </p>
        </div>

        <SettingsNav />

        <ActivityLogSection />
      </div>
    </div>
  )
}
