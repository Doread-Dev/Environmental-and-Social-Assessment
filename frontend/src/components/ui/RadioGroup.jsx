import { createContext, useContext, useId } from 'react'
import { cn } from '@/utils/cn'

const RadioGroupContext = createContext(null)

/**
 * Radio Group component
 *
 * @param {Object} props
 * @param {string} props.name - Group name
 * @param {string} props.value - Selected value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.label - Group label
 * @param {'vertical'|'horizontal'} props.orientation - Layout orientation
 * @param {string} props.error - Error message
 *
 * @example
 * <RadioGroup name="risk" value={risk} onChange={setRisk} label="Risk Category">
 *   <RadioGroup.Item value="a" label="Category A" description="High Risk" />
 *   <RadioGroup.Item value="b" label="Category B" description="Medium Risk" />
 * </RadioGroup>
 */
function RadioGroup({
  name,
  value,
  onChange,
  label,
  orientation = 'vertical',
  error,
  required = false,
  disabled = false,
  className,
  children,
}) {
  const groupId = useId()

  return (
    <RadioGroupContext.Provider value={{ name, value, onChange, disabled, groupId }}>
      <div
        role="radiogroup"
        aria-labelledby={label ? `${groupId}-label` : undefined}
        className={cn('flex flex-col gap-2', className)}
      >
        {/* Label */}
        {label && (
          <span
            id={`${groupId}-label`}
            className={cn(
              'text-sm font-semibold',
              'text-text-main dark:text-gray-200',
              disabled && 'opacity-50'
            )}
          >
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </span>
        )}

        {/* Radio items */}
        <div
          className={cn(
            'flex gap-3',
            orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
          )}
        >
          {children}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-error flex items-center gap-1">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </p>
        )}
      </div>
    </RadioGroupContext.Provider>
  )
}

/**
 * Radio Item component - must be used inside RadioGroup
 */
function RadioItem({ value, label, description, disabled: itemDisabled = false, className }) {
  const context = useContext(RadioGroupContext)
  if (!context) {
    throw new Error('RadioGroup.Item must be used within RadioGroup')
  }

  const { name, value: groupValue, onChange, disabled: groupDisabled, groupId } = context
  const isDisabled = groupDisabled || itemDisabled
  const isChecked = groupValue === value
  const id = `${groupId}-${value}`

  return (
    <label
      htmlFor={id}
      className={cn(
        'inline-flex items-start gap-3 cursor-pointer',
        isDisabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      {/* Custom radio */}
      <div className="relative flex-shrink-0 flex items-center justify-center mt-0.5">
        <input
          type="radio"
          id={id}
          name={name}
          value={value}
          checked={isChecked}
          disabled={isDisabled}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            'peer appearance-none w-5 h-5 rounded-full',
            'border-2 border-border-default dark:border-border-dark',
            'bg-white dark:bg-black/20',
            'checked:border-primary',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2',
            'transition-all duration-200 cursor-pointer',
            'disabled:cursor-not-allowed'
          )}
        />
        {/* Inner dot */}
        <span
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-2.5 h-2.5 rounded-full bg-primary',
            'scale-0 peer-checked:scale-100',
            'transition-transform duration-200',
            'flex items-center justify-center'
          )}
        />
      </div>

      {/* Label and description */}
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-text-main dark:text-white font-medium">{label}</span>
          )}
          {description && (
            <span className="text-sm text-text-secondary dark:text-gray-400">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  )
}

RadioGroup.Item = RadioItem

export default RadioGroup
