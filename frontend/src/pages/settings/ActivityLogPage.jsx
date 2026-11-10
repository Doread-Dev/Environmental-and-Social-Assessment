/**
 * ActivityLogPage
 * Settings → Activity log: the critical-actions log (D65), admin only (read_audit_log)
 * Layout: MainLayout
 * Route: /app/settings/activity-log
 */

import { ActivityLogSection, SettingsNav } from '@/components/settings'
import { PAGE_TITLE, PAGE_DESCRIPTION } from '@/components/ui'

export default function ActivityLogPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-3xl text-primary" aria-hidden="true">
              settings
            </span>
            <h1 className={PAGE_TITLE}>Settings</h1>
          </div>
          <p className={PAGE_DESCRIPTION}>Who did which critical action, and when</p>
        </div>

        <SettingsNav />

        <ActivityLogSection />
      </div>
    </div>
  )
}
