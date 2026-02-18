import { Component } from 'react'
import { ROUTES } from '@/routes/routes.config'

const CHUNK_RELOAD_KEY = 'esms_chunk_reload_done'

/** Detect chunk/module load failure (e.g. after Vercel deploy; old cached index requests deleted JS chunks) */
function isChunkLoadError(error) {
  if (!error) return false
  const msg = (error.message || '').toLowerCase()
  const name = (error.name || '').toLowerCase()
  return (
    name === 'chunkloaderror' ||
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('loading chunk') ||
    msg.includes('importing a module script failed') ||
    msg.includes('error loading dynamically imported module')
  )
}

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    if (isChunkLoadError(error)) {
      try {
        const alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY)
        if (!alreadyReloaded) {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
          window.location.reload()
          return
        }
      } catch (_) {}
    }
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleRetry = () => {
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY)
    } catch (_) {}
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const isChunk = isChunkLoadError(this.state.error)
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background dark:bg-background-dark p-6">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-text-main dark:text-white mb-2">
              {isChunk ? 'New version available' : 'Something went wrong'}
            </h1>
            <p className="text-text-secondary dark:text-gray-400 mb-6">
              {isChunk
                ? 'The app was updated. Reload the page to load the latest version.'
                : 'An unexpected error occurred. You can try again or return to the dashboard.'}
            </p>
            <div className="flex gap-3 justify-center">
              {isChunk ? (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary text-white rounded-lg"
                >
                  Reload page
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={this.handleRetry}
                    className="px-4 py-2 bg-primary text-white rounded-lg"
                  >
                    Try Again
                  </button>
                  <a href={ROUTES.DASHBOARD} className="px-4 py-2 border rounded-lg">
                    Back to Dashboard
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
