import { forwardRef, useId } from 'react'
import { cn } from '@/utils/cn'
import {
  CONTROL_SIZES,
  ERROR_TEXT_CLASSES,
  HELPER_TEXT_CLASSES,
  LABEL_CLASSES,
  controlClasses,
} from './formControl'

/**
 * The one select box of the app (D71): a native `<select>` (keyboard and screen readers work as
 * usual) with the shared form-control look. Use it for every select — filters, pickers, table
 * cells — never a raw `<select>` (a guard test fails on one).
 *
 * @param {Object} props
 * @param {string} [props.label] - Visible label (otherwise pass `aria-label`)
 * @param {Array<{value: string, label: string, disabled?: boolean}>} [props.options] - Options;
 *   or pass `<option>` / `<optgroup>` children instead
 * @param {string} [props.placeholder] - First option with value "" (e.g. "All places",
 *   "Select..."); none by default
 * @param {boolean} [props.placeholderDisabled] - The placeholder cannot be picked again
 * @param {string} [props.error] - Error message
 * @param {string} [props.helperText] - Helper text
 * @param {'sm'|'md'|'lg'} [props.size] - Height and text size (md = Button md)
 * @param {'default'|'cell'} [props.variant] - `cell`: borderless inside a table cell
 * @param {string} [props.className] - Classes of the wrapper
 * @param {string} [props.selectClassName] - Classes of the `<select>`
 *
 * @example
 * <Select label="Role" options={ROLE_OPTIONS} value={role} onChange={(e) => setRole(e.target.value)} />
 * <Select aria-label="Place filter" placeholder="All places" value={place} onChange={...}>
 *   <optgroup label="Project workflow">…</optgroup>
 * </Select>
 */
const Select = forwardRef(
  (
    {
      label,
      options,
      placeholder,
      placeholderDisabled = false,
      error,
      helperText,
      size = 'md',
      variant = 'default',
      required = false,
      disabled = false,
      className,
      selectClassName,
      id: propId,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const id = propId || generatedId
    const errorId = `${id}-error`
    const helperId = `${id}-helper`
    const isCell = variant === 'cell'

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <label htmlFor={id} className={cn(LABEL_CLASSES, disabled && 'opacity-50')}>
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}

        <div className="relative group">
          <select
            ref={ref}
            id={id}
            disabled={disabled}
            aria-required={required || undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              controlClasses({ variant, error: !!error }),
              'appearance-none cursor-pointer truncate',
              isCell ? 'py-1 pl-2 pr-7 text-sm' : cn(CONTROL_SIZES[size], 'pl-3 pr-9'),
              selectClassName
            )}
            {...props}
          >
            {placeholder != null && (
              <option value="" disabled={placeholderDisabled}>
                {placeholder}
              </option>
            )}
            {options
              ? options.map((option) => (
                  <option key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </option>
                ))
              : children}
          </select>

          <span
            className={cn(
              'absolute top-1/2 -translate-y-1/2 pointer-events-none flex',
              'text-text-secondary dark:text-gray-400',
              isCell ? 'right-1.5 opacity-60 group-hover:opacity-100' : 'right-2.5',
              disabled && 'opacity-50'
            )}
            aria-hidden="true"
          >
            <span
              className={cn('material-symbols-outlined', isCell ? 'text-lg' : 'text-xl')}
              aria-hidden="true"
            >
              expand_more
            </span>
          </span>
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

Select.displayName = 'Select'

export default Select
