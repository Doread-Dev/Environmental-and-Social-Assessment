import { Component } from 'react'
import { ROUTES } from '@/routes/routes.config'

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background dark:bg-background-dark p-6">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-text-main dark:text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-text-secondary dark:text-gray-400 mb-6">
              An unexpected error occurred. You can try again or return to the dashboard.
            </p>
            <div className="flex gap-3 justify-center">
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
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
