import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Alert, Icon } from '@/components/ui'
import { validateEmail, validatePassword } from '@/utils/validators'

/**
 * LoginPage - صفحة تسجيل الدخول
 * Layout: AuthLayout
 */
function LoginPage() {
  const navigate = useNavigate()

  // State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')

  // Handlers
  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: null }))
    }
    setGeneralError('')
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: null }))
    }
    setGeneralError('')
  }

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError('')

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

    setIsLoading(true)

    // Mock login - في الإنتاج سيتم استدعاء API
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock: قبول أي بريد وكلمة مرور (في الإنتاج سيتم التحقق من API)
      if (email && password) {
        // Navigate to dashboard
        navigate('/app/dashboard')
      } else {
        setGeneralError('Invalid email or password. Please try again.')
      }
    } catch {
      setGeneralError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[960px] bg-white dark:bg-card-dark rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-gray-100 dark:border-gray-800">
      {/* Left Side: Visual Panel */}
      <div className="relative w-full md:w-5/12 bg-emerald-50 dark:bg-emerald-900/20 flex flex-col items-center justify-center p-8 md:p-12 overflow-hidden group">
        {/* Abstract Background Pattern */}
        <div
          className="absolute inset-0 opacity-10 dark:opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, #11d452 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Hero Icon */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-white dark:bg-emerald-800 flex items-center justify-center shadow-sm mb-6">
            <Icon name="eco" className="text-[50px] text-primary" />
          </div>

          {/* Hero Image/Illustration */}
          <div className="w-full aspect-video rounded-lg overflow-hidden shadow-sm opacity-90 hidden md:block mt-8">
            <div
              className="w-full h-full bg-center bg-cover"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAWLS_HZQdBss0QYgByPrzVhjmm3gppMnQkwrT2K4Ufn4Q1TrWGxJ1hJHIEcw1fdjK7qlzR22EgH1JJ6qjz8WnO6QzXn_X_dGuqiAlc69-6DeFgqBmpv7lrsP3ei6fYwPjWRsS0MTKDsrYKOQfkxxfNimubAQX4ApKjKfSNPeFrFkw-KSbKzNlA_1k2jc5pJkoSofm_ZsNep21lOSOL-XBwJZgiAUATsRB5CrjorykNzTdz6OjnXFbrU0ZyidurRcnWXwGbiHmmhozm")',
              }}
            />
          </div>

          <p className="mt-8 text-sm font-medium text-emerald-800 dark:text-emerald-300 max-w-[200px] leading-relaxed hidden md:block">
            Securing our future through sustainable practices.
          </p>
        </div>

        {/* Decorative shape */}
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full md:w-7/12 flex flex-col justify-center p-8 md:p-12 lg:p-16 relative bg-white dark:bg-card-dark">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-text-main dark:text-white tracking-tight text-3xl font-bold leading-tight mb-2">
            Environmental & Social Management System
          </h1>
          <h2 className="text-text-muted dark:text-emerald-400 text-base font-medium">
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

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <a
              href="#"
              className="text-sm font-medium text-text-muted hover:text-primary dark:text-emerald-400 dark:hover:text-primary transition-colors"
              onClick={(e) => {
                e.preventDefault()
                // TODO: Navigate to forgot password page
              }}
            >
              Forgot password?
            </a>
          </div>

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
