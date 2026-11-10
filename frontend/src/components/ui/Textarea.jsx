import { forwardRef, useId } from 'react'
import { cn } from '@/utils/cn'
import { MAX_TEXT_LENGTH } from '@/utils/textLimits'
import {
  ERROR_TEXT_CLASSES,
  HELPER_TEXT_CLASSES,
  LABEL_CLASSES,
  READ_ONLY_CLASSES,
  controlClasses,
} from './formControl'

/**
 * Textarea component with label and validation support (shared form-control look, D71)
 *
 * @param {Object} props
 * @param {string} props.label - Textarea label
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text
 * @param {number} props.rows - Number of visible rows
 * @param {'none'|'vertical'|'horizontal'|'both'} props.resize - Allow resize (default: vertical)
 * @param {'default'|'cell'} props.variant - `cell`: borderless inside a table cell
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
      variant = 'default',
      required = false,
      disabled = false,
      className,
      textareaClassName,
      id: propId,
      // Free text: the shared limit (D74 4); a smaller one can be passed
      maxLength = MAX_TEXT_LENGTH,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const id = propId || generatedId
    const errorId = `${id}-error`
    const helperId = `${id}-helper`

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    }

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <label htmlFor={id} className={cn(LABEL_CLASSES, disabled && 'opacity-50')}>
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}

        <textarea
          maxLength={maxLength}
          ref={ref}
          id={id}
          rows={rows}
          disabled={disabled}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={cn(
            controlClasses({ variant, error: !!error }),
            READ_ONLY_CLASSES,
            variant === 'cell' ? 'px-2 py-1' : 'px-3 py-2.5 text-sm',
            resizeClasses[resize],
            textareaClassName
          )}
          {...props}
        />

        {error && (
          <p id={errorId} className={ERROR_TEXT_CLASSES}>
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              error
            </span>
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={helperId} className={HELPER_TEXT_CLASSES}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea
