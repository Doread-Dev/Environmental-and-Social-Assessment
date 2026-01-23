import { forwardRef, useId } from 'react'
import { cn } from '@/utils/cn'

/**
 * Checkbox component with label
 *
 * @param {Object} props
 * @param {string} props.label - Checkbox label
 * @param {string} props.description - Additional description
 * @param {boolean} props.checked - Controlled checked state
 * @param {boolean} props.indeterminate - Indeterminate state
 * @param {'sm'|'md'|'lg'} props.size - Checkbox size
 * @param {string} props.error - Error message
 *
 * @example
 * <Checkbox label="I agree to the terms" />
 * <Checkbox label="Select all" indeterminate={someSelected} />
 */
const Checkbox = forwardRef(
  (
    {
      label,
      description,
      checked,
      indeterminate = false,
      size = 'md',
      disabled = false,
      error,
      className,
      id: propId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const id = propId || generatedId

    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    }

    const labelSizes = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-base',
    }

    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <label
          htmlFor={id}
          className={cn(
            'inline-flex items-start gap-3 cursor-pointer',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {/* Custom checkbox */}
          <div className="relative flex-shrink-0 flex items-center justify-center mt-0.5">
            <input
              ref={ref}
              type="checkbox"
              id={id}
              checked={checked}
              disabled={disabled}
              className={cn(
                'peer appearance-none rounded',
                'border-2 border-border-default dark:border-border-dark',
                'bg-white dark:bg-black/20',
                'checked:bg-primary checked:border-primary',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2',
                'transition-all duration-200 cursor-pointer',
                'disabled:cursor-not-allowed',
                sizes[size]
              )}
              {...props}
            />
            {/* Checkmark icon */}
            <span
              className={cn(
                'absolute inset-0 flex items-center justify-center',
                'text-white opacity-0 peer-checked:opacity-100',
                'pointer-events-none transition-opacity'
              )}
            >
              <span className="material-symbols-outlined text-sm font-bold leading-none">
                {indeterminate ? 'remove' : 'check'}
              </span>
            </span>
          </div>

          {/* Label and description */}
          {(label || description) && (
            <div className="flex flex-col">
              {label && (
                <span
                  className={cn(
                    'text-text-main dark:text-white font-medium',
                    labelSizes[size]
                  )}
                >
                  {label}
                </span>
              )}
              {description && (
                <span className="text-sm text-text-secondary dark:text-gray-400">
                  {description}
                </span>
              )}
            </div>
          )}
        </label>

        {/* Error message */}
        {error && (
          <p className="text-sm text-error flex items-center gap-1 ml-8">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </p>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export default Checkbox
