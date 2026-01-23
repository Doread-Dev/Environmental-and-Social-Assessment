import { useTheme } from '@/contexts'
import { cn } from '@/utils'

function App() {
  const { isDark, toggleTheme, resolvedTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark transition-colors duration-300">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className={cn(
            'bg-surface dark:bg-surface-dark',
            'p-8 rounded-xl shadow-lg',
            'border border-border-default dark:border-border-dark',
            'max-w-md w-full'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-text-main dark:text-white">ESMS Setup</h1>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={cn(
                'flex p-2 rounded-lg transition-colors',
                'bg-background dark:bg-background-dark',
                'hover:bg-primary/10 dark:hover:bg-primary/20',
                'text-text-main dark:text-white'
              )}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              <span className="material-symbols-outlined">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-success font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">check_circle</span>
                Phase 1 Setup Complete!
              </p>
            </div>

            <div className="space-y-2 text-sm text-text-secondary dark:text-gray-400">
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">check</span>
                Vite + React configured
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">check</span>
                Tailwind CSS v4 working
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">check</span>
                ESLint + Prettier setup
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">check</span>
                Dark mode: {resolvedTheme}
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">check</span>
                Path aliases (@/) configured
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <button
              className={cn(
                'flex-1 px-4 py-3 rounded-lg font-medium',
                'bg-primary hover:bg-primary-hover',
                'text-white transition-colors',
                'shadow-[0_4px_14px_0_rgba(17,212,82,0.3)]'
              )}
            >
              Continue to Phase 2
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
