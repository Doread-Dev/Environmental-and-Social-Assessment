/**
 * SettingsNav
 * Tabs between the Settings pages the user may open. Hidden when there is only one.
 */
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts'
import { ROUTES } from '@/routes/routes.config'
import { cn } from '@/utils/cn'

export function SettingsNav() {
  const { canManageUsers, canReadAuditLog } = useAuth()

  const tabs = [
    {
      to: ROUTES.SETTINGS,
      label: canManageUsers ? 'Users & projects' : 'Projects',
      icon: 'manage_accounts',
    },
    canReadAuditLog && { to: ROUTES.SETTINGS_ACTIVITY_LOG, label: 'Activity log', icon: 'history' },
  ].filter(Boolean)

  if (tabs.length < 2) return null

  return (
    <nav
      aria-label="Settings sections"
      className="mb-8 flex gap-1 border-b border-border-default dark:border-border-dark"
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end
          className={({ isActive }) =>
            cn(
              '-mb-px flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary dark:text-gray-400 hover:text-text-main dark:hover:text-white'
            )
          }
        >
          <span className="material-symbols-outlined text-lg">{tab.icon}</span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}

export default SettingsNav
