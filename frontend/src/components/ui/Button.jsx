import { forwardRef } from 'react'
import { cn } from '@/utils/cn'
import LoadingSpinner from './LoadingSpinner'

/**
 * Button component with multiple variants and sizes
 *
 * @param {Object} props
 * @param {'primary'|'secondary'|'outline'|'ghost'|'danger'} props.variant - Button style variant (the app's only button styles, D71)
 * @param {'sm'|'md'|'lg'} props.size - Button size
 * @param {boolean} props.disabled - Disable button
 * @param {boolean} props.isLoading - Show loading spinner
 * @param {boolean} props.fullWidth - Make button full width
 * @param {React.ReactNode} props.leftIcon - Icon on left side
 * @param {React.ReactNode} props.rightIcon - Icon on right side
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.className - Additional classes
 *
 * @example
 * <Button variant="primary" size="md">Click me</Button>
 * <Button variant="outline" leftIcon={<Icon name="add" />}>Add Item</Button>
 * <Button isLoading>Saving...</Button>
 */
const Button = forwardRef(
  (
    {
      variant = 'primary',
      size = 'md',
      disabled = false,
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // Base styles (one focus ring for every button, visible on keyboard focus, D71)
    const baseStyles = cn(
      'inline-flex items-center justify-center shrink-0 whitespace-nowrap',
      'font-semibold rounded-lg',
      'transition-colors duration-200',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'focus-visible:ring-offset-surface dark:focus-visible:ring-offset-surface-dark',
      'disabled:opacity-50 disabled:cursor-not-allowed'
    )

    // Variant styles
    const variants = {
      primary: cn(
        'bg-primary hover:bg-primary-hover disabled:hover:bg-primary',
        'text-white shadow-sm shadow-primary/20',
        'focus-visible:ring-primary/50'
      ),
      secondary: cn(
        'bg-surface dark:bg-surface-dark',
        'border border-border-default dark:border-border-dark',
        'text-text-main dark:text-white',
        'hover:bg-background dark:hover:bg-background-dark',
        'focus-visible:ring-primary/40'
      ),
      outline: cn(
        'border border-primary',
        'text-primary dark:text-green-300 dark:border-green-400/60',
        'hover:bg-primary/10 dark:hover:bg-primary/20',
        'focus-visible:ring-primary/50'
      ),
      ghost: cn(
        'text-text-secondary dark:text-gray-400',
        'hover:text-text-main dark:hover:text-white',
        'hover:bg-background dark:hover:bg-white/5',
        'focus-visible:ring-primary/40'
      ),
      danger: cn(
        'bg-red-600 hover:bg-red-700 disabled:hover:bg-red-600',
        'text-white shadow-sm',
        'focus-visible:ring-red-500/50'
      ),
    }

    // Size styles
    const sizes = {
      sm: 'h-8 px-3 text-sm gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2',
    }

    // Icon sizes mapping
    const iconSizes = {
      sm: 'sm',
      md: 'sm',
      lg: 'md',
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        {...props}
      >
        {isLoading ? (
          <>
            <LoadingSpinner size={iconSizes[size]} />
            {children}
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="flex-shrink-0 flex" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className="flex-shrink-0 flex" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
