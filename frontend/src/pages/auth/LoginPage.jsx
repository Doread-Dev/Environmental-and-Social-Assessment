import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button, Input, Alert, Icon, LoadingState, PAGE_TITLE } from '@/components/ui'
import { validateEmail, validatePassword } from '@/utils/validators'
import { useAuth } from '@/contexts'
import { ROUTES } from '@/routes/routes.config'
// Local assets: the login page works offline (D37, D51)
import akfLogo from '@/assets/auth/akf-logo.png'
import syriaMap from '@/assets/auth/syria-map.png'

/**
 * LoginPage - sign-in page
 * Layout: AuthLayout
 */
function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, isLoading: authLoading, error: authError, clearError } = useAuth()

  // Get redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || ROUTES.DASHBOARD

  // State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate, from])

  // Sync auth error to local error state
  useEffect(() => {
    if (authError) {
      setGeneralError(authError)
    }
  }, [authError])

  // Handlers
  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: null }))
    }
    setGeneralError('')
    clearError()
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: null }))
    }
    setGeneralError('')
    clearError()
  }

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError('')
    clearError()

    // Validation
    const emailValidation = validateEmail(email)
    const passwordValidation = validatePassword(password)

    const newErrors = {}
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error
    }
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.error
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    // Real API login via AuthContext
    try {
      const result = await login(email, password)

      if (!result.success) {
        setGeneralError(result.error || 'Login failed. Please try again.')
      }
      // Navigation is handled by useEffect watching isAuthenticated
    } catch {
      setGeneralError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading if checking auth status
  if (authLoading) {
    return <LoadingState message="Loading..." />
  }

  const isLoading = isSubmitting || authLoading

  return (
    <div className="w-full max-w-[960px] bg-surface dark:bg-card-dark rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-border-default dark:border-border-dark">
      {/* Left Side: AKF logo and map of Syria (D51) */}
      <div className="relative w-full md:w-5/12 bg-primary-soft dark:bg-primary/10 flex flex-col items-center justify-center p-8 md:p-12 overflow-hidden">
        {/* Abstract Background Pattern */}
        <div
          className="absolute inset-0 opacity-10 dark:opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, var(--color-green-500) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* The logo PNG is transparent: no box behind it (as v2) */}
          <img
            src={akfLogo}
            alt="Aga Khan Foundation logo"
            className="w-56 max-w-full h-auto mb-6 drop-shadow-md"
          />

          <img
            src={syriaMap}
            alt="Map of Syria"
            className="w-52 max-w-full h-auto rounded-2xl drop-shadow-sm mt-4 hidden md:block"
          />

          <p className="mt-8 text-sm font-medium text-green-800 dark:text-green-300 max-w-[240px] leading-relaxed hidden md:block">
            Securing the future through sustainable practices.
          </p>
        </div>

        {/* Decorative shape */}
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full md:w-7/12 flex flex-col justify-center p-8 md:p-12 lg:p-16 relative bg-surface dark:bg-card-dark">
        {/* Header */}
        <div className="mb-8">
          <h1 className={PAGE_TITLE}>Environmental & Social Management System</h1>
          <h2 className="text-primary dark:text-green-300 text-lg font-medium">
            Aga Khan Foundation – Syria
          </h2>
        </div>

        {/* Error Alert */}
        {generalError && (
          <Alert variant="error" className="mb-6" dismissible onDismiss={() => setGeneralError('')}>
            {generalError}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-md">
          {/* Email Field */}
          <Input
            label="Email address"
            type="email"
            placeholder="name@akdn.org"
            value={email}
            onChange={handleEmailChange}
            leftIcon={<Icon name="mail" />}
            error={errors.email}
            required
            disabled={isLoading}
          />

          {/* Password Field */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label
                htmlFor="password"
                className="text-text-main dark:text-gray-200 text-sm font-semibold"
              >
                Password
              </label>
            </div>
            <div className="relative group">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                leftIcon={<Icon name="lock" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="flex text-text-muted hover:text-text-main dark:hover:text-white transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon
                      name={showPassword ? 'visibility_off' : 'visibility'}
                      className="text-xl"
                    />
                  </button>
                }
                error={errors.password}
                disabled={isLoading}
                inputClassName="pr-12"
              />
            </div>
          </div>

          {/* No self-service reset offline (D25): an admin resets the password */}
          <p className="text-sm text-text-secondary dark:text-gray-400 text-right">
            Forgot your password? Contact your system administrator.
          </p>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
            rightIcon={<Icon name="arrow_forward" />}
            className="mt-2"
          >
            Login
          </Button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
