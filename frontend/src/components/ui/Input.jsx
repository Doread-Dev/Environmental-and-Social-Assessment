import { forwardRef, useId } from 'react'
import { cn } from '@/utils/cn'
import {
  CONTROL_SIZES,
  ERROR_TEXT_CLASSES,
  HELPER_TEXT_CLASSES,
  LABEL_CLASSES,
  READ_ONLY_CLASSES,
  controlClasses,
} from './formControl'

/**
 * Input component with label, icon, and validation support (shared form-control look, D71)
 *
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text below input
 * @param {React.ReactNode} props.leftIcon - Icon on left side
 * @param {React.ReactNode} props.rightIcon - Icon on right side
 * @param {'sm'|'md'|'lg'} props.size - Input size (md = Button md)
 * @param {'default'|'cell'} props.variant - `cell`: borderless inside a table cell
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
      variant = 'default',
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
    const isCell = variant === 'cell'

    const paddingLeft = {
      sm: leftIcon ? 'pl-9' : 'pl-3',
      md: leftIcon ? 'pl-10' : 'pl-3',
      lg: leftIcon ? 'pl-11' : 'pl-4',
    }
    const paddingRight = {
      sm: rightIcon ? 'pr-9' : 'pr-3',
      md: rightIcon ? 'pr-10' : 'pr-3',
      lg: rightIcon ? 'pr-11' : 'pr-4',
    }
    const iconLeft = { sm: 'left-3', md: 'left-3', lg: 'left-4' }
    const iconRight = { sm: 'right-3', md: 'right-3', lg: 'right-4' }

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <label htmlFor={id} className={cn(LABEL_CLASSES, disabled && 'opacity-50')}>
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <span
              className={cn(
                'absolute top-1/2 -translate-y-1/2 flex pointer-events-none',
                iconLeft[size],
                'text-text-secondary dark:text-gray-400'
              )}
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            disabled={disabled}
            aria-required={required || undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              controlClasses({ variant, error: !!error }),
              READ_ONLY_CLASSES,
              isCell ? 'px-2 py-1' : cn(CONTROL_SIZES[size], paddingLeft[size], paddingRight[size]),
              inputClassName
            )}
            {...props}
          />

          {rightIcon && (
            <span
              className={cn(
                'absolute top-1/2 -translate-y-1/2 flex',
                iconRight[size],
                'text-text-secondary dark:text-gray-400'
              )}
            >
              {rightIcon}
            </span>
          )}
        </div>

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

Input.displayName = 'Input'

export default Input
