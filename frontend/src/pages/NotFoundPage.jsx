import { ROUTES } from '@/routes/routes.config'
import { PAGE_TITLE, PAGE_DESCRIPTION } from '@/components/ui'

/**
 * 404 page (eager: small, shown for every unknown path)
 */
export default function NotFoundPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background dark:bg-background-dark p-6">
      <div className="text-center">
        <p className="text-6xl font-bold text-primary dark:text-green-300 mb-4">404</p>
        <h1 className={PAGE_TITLE}>Page Not Found</h1>
        <p className={`${PAGE_DESCRIPTION} mb-6`}>
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <a
          href={ROUTES.DASHBOARD}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">
            home
          </span>
          Back to Dashboard
        </a>
      </div>
    </main>
  )
}
