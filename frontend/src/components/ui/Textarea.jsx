import { forwardRef, useId } from 'react'
import { cn } from '@/utils/cn'

/**
 * Textarea component with label and validation support
 *
 * @param {Object} props
 * @param {string} props.label - Textarea label
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text
 * @param {number} props.rows - Number of visible rows
 * @param {'none'|'vertical'|'horizontal'|'both'} props.resize - Allow resize (default: vertical)
 * @param {boolean} props.required - Mark as required
 *
 * @example
 * <Textarea label="Description" rows={4} placeholder="Enter description..." />
 */
const Textarea = forwardRef(
  (
    {
      label,
      error,
      helperText,
      rows = 4,
      resize = 'vertical',
      required = false,
      disabled = false,
      className,
      textareaClassName,
      id: propId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const id = propId || generatedId
    const errorId = `${id}-error`

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
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

        {/* Textarea */}
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'w-full rounded-lg px-4 py-3',
            'border bg-white dark:bg-black/20',
            'text-text-main dark:text-white text-base',
            'placeholder:text-text-muted/70 dark:placeholder:text-gray-500',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            resizeClasses[resize],
            error
              ? 'border-error focus:border-error focus:ring-error/20'
              : 'border-input-border dark:border-input-border-dark',
            disabled && 'opacity-50 cursor-not-allowed',
            textareaClassName
          )}
          {...props}
        />

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

Textarea.displayName = 'Textarea'

export default Textarea
