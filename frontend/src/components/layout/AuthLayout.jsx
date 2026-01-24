import { Outlet } from 'react-router-dom'
import { cn } from '@/utils'
import { Icon } from '@/components/ui'

/**
 * AuthLayout - Layout for authentication pages (Login, etc.)
 * Centered card layout with decorative background
 */
function AuthLayout({ className }) {
  return (
    <div
      className={cn(
        'min-h-screen w-full',
        'bg-background dark:bg-background-dark',
        'flex items-center justify-center',
        'p-4 sm:p-6 lg:p-8',
        'transition-colors duration-300',
        className
      )}
    >
      {/* Background Pattern */}
      <div
        className="fixed inset-0 opacity-5 dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center text-left gap-[30px]">
        <Outlet />
        <p className="flex items-center gap-2 text-xs font-medium text-text-muted dark:text-gray-500 uppercase tracking-wider">
          <Icon name="verified_user" className="text-base" />
          Authorized users only
        </p>
      </div>
    </div>
  )
}

export default AuthLayout
