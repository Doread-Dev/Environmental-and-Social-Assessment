import { forwardRef, useId } from 'react'
import { cn } from '@/utils/cn'

/**
 * Select dropdown component
 *
 * @param {Object} props
 * @param {string} props.label - Select label
 * @param {Array<{value: string, label: string, disabled?: boolean}>} props.options - Options array
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text
 * @param {'sm'|'md'|'lg'} props.size - Select size
 *
 * @example
 * <Select
 *   label="Risk Category"
 *   options={[
 *     { value: 'a', label: 'Category A - High Risk' },
 *     { value: 'b', label: 'Category B - Medium Risk' },
 *   ]}
 *   placeholder="Select a category"
 * />
 */
const Select = forwardRef(
  (
    {
      label,
      options = [],
      placeholder = 'Select an option',
      error,
      helperText,
      size = 'md',
      required = false,
      disabled = false,
      className,
      selectClassName,
      id: propId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const id = propId || generatedId
    const errorId = `${id}-error`

    const sizes = {
      sm: 'h-9 text-sm pl-3 pr-8',
      md: 'h-11 text-base pl-4 pr-10',
      lg: 'h-12 text-base pl-4 pr-10',
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

        {/* Select wrapper */}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'w-full rounded-lg appearance-none',
              'border bg-white dark:bg-black/20',
              'text-text-main dark:text-white',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
              'cursor-pointer',
              sizes[size],
              error
                ? 'border-error focus:border-error focus:ring-error/20'
                : 'border-input-border dark:border-input-border-dark',
              disabled && 'opacity-50 cursor-not-allowed',
              selectClassName
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Dropdown arrow */}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted dark:text-gray-500">
            <span className="material-symbols-outlined text-xl">expand_more</span>
          </span>
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
          <p className="text-sm text-text-secondary dark:text-gray-400">{helperText}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
