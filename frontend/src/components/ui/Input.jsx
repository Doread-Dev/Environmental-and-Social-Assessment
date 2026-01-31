import { forwardRef, useId } from 'react'
import { cn } from '@/utils/cn'

/**
 * Input component with label, icon, and validation support
 *
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text below input
 * @param {React.ReactNode} props.leftIcon - Icon on left side
 * @param {React.ReactNode} props.rightIcon - Icon on right side
 * @param {'sm'|'md'|'lg'} props.size - Input size
 * @param {boolean} props.required - Mark as required
 * @param {string} props.className - Additional classes for wrapper
 * @param {string} props.inputClassName - Additional classes for input
 *
 * @example
 * <Input label="Email" type="email" placeholder="name@example.com" />
 * <Input label="Password" type="password" error="Password is required" />
 * <Input leftIcon={<Icon name="search" />} placeholder="Search..." />
 */
const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      size = 'md',
      required = false,
      disabled = false,
      className,
      inputClassName,
      id: propId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const id = propId || generatedId
    const errorId = `${id}-error`
    const helperId = `${id}-helper`

    // Size styles
    const sizes = {
      sm: 'h-9 text-sm',
      md: 'h-11 text-base',
      lg: 'h-12 text-base',
    }

    const paddingLeft = {
      sm: leftIcon ? 'pl-9' : 'pl-3',
      md: leftIcon ? 'pl-11' : 'pl-4',
      lg: leftIcon ? 'pl-12' : 'pl-4',
    }

    const paddingRight = {
      sm: rightIcon ? 'pr-9' : 'pr-3',
      md: rightIcon ? 'pr-11' : 'pr-4',
      lg: rightIcon ? 'pr-12' : 'pr-4',
    }

    const iconPositionLeft = {
      sm: 'left-3',
      md: 'left-4',
      lg: 'left-4',
    }

    const iconPositionRight = {
      sm: 'right-3',
      md: 'right-4',
      lg: 'right-4',
    }

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'text-sm font-semibold',
              'text-text-main dark:text-gray-200',
              disabled && 'opacity-50'
            )}
          >
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <span
              className={cn(
                'absolute top-1/2 -translate-y-1/2',
                iconPositionLeft[size],
                'text-text-muted dark:text-gray-500',
                'pointer-events-none'
              )}
            >
              {leftIcon}
            </span>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={id}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              'w-full rounded-lg',
              'border bg-white dark:bg-black/20',
              'text-text-main dark:text-white',
              'placeholder:text-text-muted/70 dark:placeholder:text-gray-500',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
              sizes[size],
              paddingLeft[size],
              paddingRight[size],
              // Border colors
              error
                ? 'border-error focus:border-error focus:ring-error/20'
                : 'border-input-border dark:border-input-border-dark',
              // Disabled state
              disabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-white/5',
              inputClassName
            )}
            {...props}
          />

          {/* Right icon */}
          {rightIcon && (
            <span
              className={cn(
                'absolute top-1/2 -translate-y-1/2',
                iconPositionRight[size],
                'text-text-muted dark:text-gray-500'
              )}
            >
              {rightIcon}
            </span>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p id={errorId} className="text-sm text-error flex items-center gap-1">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </p>
        )}

        {/* Helper text */}
        {!error && helperText && (
          <p id={helperId} className="text-sm text-text-secondary dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
