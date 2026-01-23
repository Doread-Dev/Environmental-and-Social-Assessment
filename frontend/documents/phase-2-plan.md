# Phase 2: Component Library (UI Kit)
## خطة تفصيلية مرتبة

---

## نظرة عامة على المرحلة

**الهدف الرئيسي:** بناء مكتبة مكونات UI قابلة لإعادة الاستخدام مع دعم كامل للوضع المظلم

**المتطلبات السابقة:** إكمال Phase 1 (Project Setup & Build Pipeline)

**المخرجات النهائية:**
- 18+ مكون UI مشترك
- دعم Dark Mode لجميع المكونات
- توثيق Props عبر JSDoc
- Barrel Exports للمكونات
- اختبار المكونات بشكل منفصل

---

## قائمة المكونات المطلوبة

### مكونات Form Controls (7 مكونات)
| # | المكون | الأولوية | التعقيد |
|---|--------|---------|---------|
| 1 | `Button` | عالية | متوسط |
| 2 | `Input` | عالية | متوسط |
| 3 | `Textarea` | عالية | منخفض |
| 4 | `Select` | عالية | متوسط |
| 5 | `Checkbox` | عالية | منخفض |
| 6 | `RadioGroup` | متوسطة | متوسط |
| 7 | `FileUpload` | منخفضة | عالي |

### مكونات Display (8 مكونات)
| # | المكون | الأولوية | التعقيد |
|---|--------|---------|---------|
| 8 | `Card` | عالية | منخفض |
| 9 | `Badge` | عالية | منخفض |
| 10 | `Avatar` | متوسطة | منخفض |
| 11 | `Alert` | عالية | منخفض |
| 12 | `Table` | عالية | عالي |
| 13 | `Modal` | عالية | عالي |
| 14 | `Tooltip` | متوسطة | متوسط |
| 15 | `Dropdown` | عالية | عالي |

### مكونات Navigation (5 مكونات)
| # | المكون | الأولوية | التعقيد |
|---|--------|---------|---------|
| 16 | `Breadcrumb` | متوسطة | منخفض |
| 17 | `ProgressStepper` | عالية | متوسط |
| 18 | `ProgressBar` | عالية | منخفض |
| 19 | `Pagination` | متوسطة | متوسط |
| 20 | `Accordion` | متوسطة | متوسط |

---

## الخطوة 1: إعداد البنية الأساسية للمكونات

### 1.1 التحقق من إكمال Phase 1

```bash
cd frontend

# التأكد من وجود الملفات الأساسية
# src/utils/cn.js يجب أن يكون موجوداً
# ThemeContext يجب أن يكون يعمل
```

### 1.2 إنشاء مكون LoadingSpinner (مساعد)

**إنشاء `src/components/ui/LoadingSpinner.jsx`:**

```jsx
import { cn } from '@/utils/cn'

/**
 * Loading spinner component
 * @param {Object} props
 * @param {'sm'|'md'|'lg'} props.size - Spinner size
 * @param {string} props.className - Additional classes
 */
function LoadingSpinner({ size = 'md', className }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  return (
    <svg
      className={cn('animate-spin', sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

export default LoadingSpinner
```

### 1.3 إنشاء Icon Wrapper Component

**إنشاء `src/components/ui/Icon.jsx`:**

```jsx
import { cn } from '@/utils/cn'

/**
 * Material Symbols icon wrapper
 * @param {Object} props
 * @param {string} props.name - Icon name from Material Symbols
 * @param {'sm'|'md'|'lg'|'xl'} props.size - Icon size
 * @param {boolean} props.filled - Whether to use filled variant
 * @param {string} props.className - Additional classes
 */
function Icon({ name, size = 'md', filled = false, className, ...props }) {
  const sizes = {
    sm: 'text-lg',    // 18px
    md: 'text-xl',    // 20px
    lg: 'text-2xl',   // 24px
    xl: 'text-3xl',   // 30px
  }

  return (
    <span
      className={cn(
        'material-symbols-outlined select-none',
        sizes[size],
        filled && 'font-variation-settings: "FILL" 1',
        className
      )}
      aria-hidden="true"
      {...props}
    >
      {name}
    </span>
  )
}

export default Icon
```

---

## الخطوة 2: مكونات Form Controls

### 2.1 Button Component

**إنشاء `src/components/ui/Button.jsx`:**

```jsx
import { forwardRef } from 'react'
import { cn } from '@/utils/cn'
import LoadingSpinner from './LoadingSpinner'

/**
 * Button component with multiple variants and sizes
 * 
 * @param {Object} props
 * @param {'primary'|'secondary'|'outline'|'ghost'|'danger'} props.variant - Button style variant
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
const Button = forwardRef(({
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
}, ref) => {
  // Base styles
  const baseStyles = cn(
    'inline-flex items-center justify-center',
    'font-medium rounded-lg',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  )

  // Variant styles
  const variants = {
    primary: cn(
      'bg-primary hover:bg-primary-hover',
      'text-white',
      'shadow-[0_4px_14px_0_rgba(17,212,82,0.3)]',
      'focus:ring-primary/50',
      'dark:shadow-[0_4px_14px_0_rgba(17,212,82,0.2)]'
    ),
    secondary: cn(
      'bg-surface dark:bg-surface-dark',
      'border border-border-default dark:border-border-dark',
      'text-text-main dark:text-white',
      'hover:bg-background dark:hover:bg-background-dark',
      'focus:ring-border-default'
    ),
    outline: cn(
      'border-2 border-primary',
      'text-primary',
      'hover:bg-primary/10 dark:hover:bg-primary/20',
      'focus:ring-primary/50'
    ),
    ghost: cn(
      'text-text-secondary dark:text-gray-400',
      'hover:text-text-main dark:hover:text-white',
      'hover:bg-background dark:hover:bg-surface-dark',
      'focus:ring-border-default'
    ),
    danger: cn(
      'bg-error hover:bg-red-600',
      'text-white',
      'focus:ring-error/50'
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
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size={iconSizes[size]} />
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children && <span>{children}</span>}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  )
})

Button.displayName = 'Button'

export default Button
```

### 2.2 Input Component

**إنشاء `src/components/ui/Input.jsx`:**

```jsx
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
const Input = forwardRef(({
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
}, ref) => {
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
            disabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900',
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
})

Input.displayName = 'Input'

export default Input
```

### 2.3 Textarea Component

**إنشاء `src/components/ui/Textarea.jsx`:**

```jsx
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
 * @param {boolean} props.resize - Allow resize (default: vertical)
 * @param {boolean} props.required - Mark as required
 * 
 * @example
 * <Textarea label="Description" rows={4} placeholder="Enter description..." />
 */
const Textarea = forwardRef(({
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
}, ref) => {
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
        <p className="text-sm text-text-secondary dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'

export default Textarea
```

### 2.4 Select Component

**إنشاء `src/components/ui/Select.jsx`:**

```jsx
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
const Select = forwardRef(({
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
}, ref) => {
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
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
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
        <p className="text-sm text-text-secondary dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  )
})

Select.displayName = 'Select'

export default Select
```

### 2.5 Checkbox Component

**إنشاء `src/components/ui/Checkbox.jsx`:**

```jsx
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
const Checkbox = forwardRef(({
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
}, ref) => {
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
        <div className="relative flex-shrink-0 mt-0.5">
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
            <span className="material-symbols-outlined text-sm font-bold">
              {indeterminate ? 'remove' : 'check'}
            </span>
          </span>
        </div>

        {/* Label and description */}
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className={cn(
                'text-text-main dark:text-white font-medium',
                labelSizes[size]
              )}>
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
})

Checkbox.displayName = 'Checkbox'

export default Checkbox
```

### 2.6 RadioGroup Component

**إنشاء `src/components/ui/RadioGroup.jsx`:**

```jsx
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
function RadioItem({
  value,
  label,
  description,
  disabled: itemDisabled = false,
  className,
}) {
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
      <div className="relative flex-shrink-0 mt-0.5">
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
            'transition-transform duration-200'
          )}
        />
      </div>

      {/* Label and description */}
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-text-main dark:text-white font-medium">
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
  )
}

RadioGroup.Item = RadioItem

export default RadioGroup
```

### 2.7 FileUpload Component

**إنشاء `src/components/ui/FileUpload.jsx`:**

```jsx
import { useState, useRef, useCallback } from 'react'
import { cn } from '@/utils/cn'
import Button from './Button'

/**
 * File Upload component with drag and drop
 * 
 * @param {Object} props
 * @param {string} props.accept - Accepted file types (e.g., "image/*,.pdf")
 * @param {boolean} props.multiple - Allow multiple files
 * @param {number} props.maxSize - Max file size in bytes
 * @param {number} props.maxFiles - Max number of files
 * @param {Function} props.onUpload - Upload handler (files) => void
 * @param {Function} props.onError - Error handler (error) => void
 * @param {string} props.label - Upload area label
 * @param {string} props.hint - Hint text
 * 
 * @example
 * <FileUpload
 *   accept="image/*,.pdf"
 *   multiple
 *   maxSize={5 * 1024 * 1024}
 *   onUpload={(files) => handleFiles(files)}
 * />
 */
function FileUpload({
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 10,
  onUpload,
  onError,
  label = 'Upload files',
  hint = 'Drag and drop or click to browse',
  disabled = false,
  className,
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState([])
  const inputRef = useRef(null)

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFiles = useCallback((fileList) => {
    const validFiles = []
    const errors = []

    Array.from(fileList).forEach((file) => {
      if (file.size > maxSize) {
        errors.push(`${file.name} exceeds max size of ${formatFileSize(maxSize)}`)
      } else {
        validFiles.push(file)
      }
    })

    if (!multiple && validFiles.length > 1) {
      validFiles.splice(1)
    }

    if (validFiles.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`)
      validFiles.splice(maxFiles)
    }

    return { validFiles, errors }
  }, [maxSize, maxFiles, multiple])

  const handleFiles = useCallback((fileList) => {
    const { validFiles, errors } = validateFiles(fileList)

    if (errors.length > 0 && onError) {
      onError(errors)
    }

    if (validFiles.length > 0) {
      setFiles(validFiles)
      onUpload?.(validFiles)
    }
  }, [validateFiles, onUpload, onError])

  const handleDragOver = (e) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (!disabled) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }

  const handleChange = (e) => {
    handleFiles(e.target.files)
  }

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onUpload?.(newFiles)
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Drop zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8',
          'flex flex-col items-center justify-center gap-3',
          'cursor-pointer transition-all duration-200',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border-default dark:border-border-dark hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />

        <span className="material-symbols-outlined text-4xl text-text-muted dark:text-gray-500">
          cloud_upload
        </span>

        <div className="text-center">
          <p className="text-text-main dark:text-white font-medium">{label}</p>
          <p className="text-sm text-text-secondary dark:text-gray-400">{hint}</p>
          <p className="text-xs text-text-muted dark:text-gray-500 mt-1">
            Max size: {formatFileSize(maxSize)}
          </p>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg',
                'bg-background dark:bg-surface-dark',
                'border border-border-default dark:border-border-dark'
              )}
            >
              <span className="material-symbols-outlined text-text-muted">
                description
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-main dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-xs text-text-secondary dark:text-gray-400">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-error/10 rounded text-text-muted hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUpload
```

---

## الخطوة 3: مكونات Display

### 3.1 Card Component

**إنشاء `src/components/ui/Card.jsx`:**

```jsx
import { cn } from '@/utils/cn'

/**
 * Card component with compound pattern
 * 
 * @example
 * <Card>
 *   <Card.Header>
 *     <Card.Title>Project Overview</Card.Title>
 *     <Card.Description>View project details</Card.Description>
 *   </Card.Header>
 *   <Card.Body>Content here...</Card.Body>
 *   <Card.Footer>Footer actions</Card.Footer>
 * </Card>
 */
function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'bg-surface dark:bg-surface-dark',
        'rounded-xl border border-border-default dark:border-border-dark',
        'shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn('px-6 py-4 border-b border-border-default dark:border-border-dark', className)}
      {...props}
    >
      {children}
    </div>
  )
}

function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn('text-lg font-semibold text-text-main dark:text-white', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn('text-sm text-text-secondary dark:text-gray-400 mt-1', className)}
      {...props}
    >
      {children}
    </p>
  )
}

function CardBody({ className, children, ...props }) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  )
}

function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'px-6 py-4 border-t border-border-default dark:border-border-dark',
        'bg-background/50 dark:bg-background-dark/50',
        'rounded-b-xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

Card.Header = CardHeader
Card.Title = CardTitle
Card.Description = CardDescription
Card.Body = CardBody
Card.Footer = CardFooter

export default Card
```

### 3.2 Badge Component

**إنشاء `src/components/ui/Badge.jsx`:**

```jsx
import { cn } from '@/utils/cn'

/**
 * Badge component for status indicators
 * 
 * @param {Object} props
 * @param {'default'|'success'|'warning'|'error'|'info'|'primary'} props.variant
 * @param {'sm'|'md'|'lg'} props.size
 * @param {boolean} props.dot - Show status dot
 * @param {React.ReactNode} props.icon - Badge icon
 * 
 * @example
 * <Badge variant="success">Approved</Badge>
 * <Badge variant="warning" dot>Pending</Badge>
 * <Badge variant="error" icon={<Icon name="error" />}>Failed</Badge>
 */
function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  className,
  children,
  ...props
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    primary: 'bg-primary/10 text-primary dark:bg-primary/20',
  }

  const dotColors = {
    default: 'bg-gray-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    primary: 'bg-primary',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  )
}

export default Badge
```

### 3.3 Avatar Component

**إنشاء `src/components/ui/Avatar.jsx`:**

```jsx
import { useState } from 'react'
import { cn } from '@/utils/cn'

/**
 * Avatar component with fallback
 * 
 * @param {Object} props
 * @param {string} props.src - Image source
 * @param {string} props.alt - Alt text
 * @param {string} props.fallback - Fallback initials (e.g., "JD")
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} props.size
 * @param {'circle'|'square'} props.shape
 * @param {'online'|'offline'|'away'|'busy'} props.status
 * 
 * @example
 * <Avatar src="/user.jpg" alt="John Doe" fallback="JD" />
 * <Avatar fallback="AB" size="lg" status="online" />
 */
function Avatar({
  src,
  alt = '',
  fallback,
  size = 'md',
  shape = 'circle',
  status,
  className,
  ...props
}) {
  const [hasError, setHasError] = useState(false)

  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  }

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  }

  const shapes = {
    circle: 'rounded-full',
    square: 'rounded-lg',
  }

  const showFallback = !src || hasError

  return (
    <div className={cn('relative inline-flex', className)} {...props}>
      {showFallback ? (
        <div
          className={cn(
            'flex items-center justify-center',
            'bg-primary/10 text-primary font-medium',
            sizes[size],
            shapes[shape]
          )}
        >
          {fallback || <span className="material-symbols-outlined">person</span>}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className={cn(
            'object-cover',
            sizes[size],
            shapes[shape]
          )}
        />
      )}

      {/* Status indicator */}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0',
            'border-2 border-white dark:border-surface-dark rounded-full',
            statusSizes[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  )
}

export default Avatar
```

### 3.4 Alert Component

**إنشاء `src/components/ui/Alert.jsx`:**

```jsx
import { useState } from 'react'
import { cn } from '@/utils/cn'

/**
 * Alert/Banner component for notifications
 * 
 * @param {Object} props
 * @param {'info'|'success'|'warning'|'error'} props.variant
 * @param {string} props.title - Alert title
 * @param {boolean} props.dismissible - Allow dismiss
 * @param {Function} props.onDismiss - Dismiss callback
 * @param {React.ReactNode} props.icon - Custom icon
 * @param {React.ReactNode} props.action - Action button
 * 
 * @example
 * <Alert variant="success" title="Success!" dismissible>
 *   Your changes have been saved.
 * </Alert>
 */
function Alert({
  variant = 'info',
  title,
  dismissible = false,
  onDismiss,
  icon,
  action,
  className,
  children,
  ...props
}) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  const variants = {
    info: {
      container: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      title: 'text-blue-800 dark:text-blue-300',
      text: 'text-blue-700 dark:text-blue-300',
      defaultIcon: 'info',
    },
    success: {
      container: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      title: 'text-green-800 dark:text-green-300',
      text: 'text-green-700 dark:text-green-300',
      defaultIcon: 'check_circle',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
      icon: 'text-yellow-600 dark:text-yellow-400',
      title: 'text-yellow-800 dark:text-yellow-300',
      text: 'text-yellow-700 dark:text-yellow-300',
      defaultIcon: 'warning',
    },
    error: {
      container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      title: 'text-red-800 dark:text-red-300',
      text: 'text-red-700 dark:text-red-300',
      defaultIcon: 'error',
    },
  }

  const styles = variants[variant]

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 p-4 rounded-lg border',
        styles.container,
        className
      )}
      {...props}
    >
      {/* Icon */}
      <span className={cn('material-symbols-outlined text-xl flex-shrink-0', styles.icon)}>
        {icon || styles.defaultIcon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={cn('font-semibold', styles.title)}>{title}</h4>
        )}
        {children && (
          <p className={cn('text-sm', title && 'mt-1', styles.text)}>{children}</p>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>

      {/* Dismiss button */}
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className={cn(
            'flex-shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5',
            'transition-colors',
            styles.icon
          )}
          aria-label="Dismiss"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      )}
    </div>
  )
}

export default Alert
```

### 3.5 Modal Component

**إنشاء `src/components/ui/Modal.jsx`:**

```jsx
import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'

/**
 * Modal/Dialog component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close handler
 * @param {string} props.title - Modal title
 * @param {string} props.description - Modal description
 * @param {'sm'|'md'|'lg'|'xl'|'full'} props.size - Modal size
 * @param {boolean} props.closeOnOverlay - Close when clicking overlay
 * @param {boolean} props.closeOnEscape - Close on Escape key
 * @param {boolean} props.showCloseButton - Show close button
 * 
 * @example
 * <Modal isOpen={isOpen} onClose={close} title="Confirm Action">
 *   <p>Are you sure?</p>
 *   <Modal.Footer>
 *     <Button variant="ghost" onClick={close}>Cancel</Button>
 *     <Button onClick={confirm}>Confirm</Button>
 *   </Modal.Footer>
 * </Modal>
 */
function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  closeOnOverlay = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  children,
}) {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
  }

  // Handle Escape key
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape' && closeOnEscape) {
      onClose?.()
    }
  }, [closeOnEscape, onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlay) {
      onClose?.()
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleOverlayClick}
      />

      {/* Modal content */}
      <div
        className={cn(
          'relative w-full',
          'bg-surface dark:bg-surface-dark',
          'rounded-2xl shadow-xl',
          'border border-border-default dark:border-border-dark',
          'animate-slide-in',
          sizes[size],
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-border-default dark:border-border-dark">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-text-main dark:text-white"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
                  className="text-sm text-text-secondary dark:text-gray-400 mt-1"
                >
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'p-1 rounded-lg -mr-1',
                  'text-text-muted hover:text-text-main',
                  'dark:text-gray-500 dark:hover:text-white',
                  'hover:bg-background dark:hover:bg-background-dark',
                  'transition-colors'
                )}
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(100vh-16rem)]">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

function ModalFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 mt-4 pt-4',
        'border-t border-border-default dark:border-border-dark',
        '-mx-6 -mb-4 px-6 pb-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

Modal.Footer = ModalFooter

export default Modal
```

### 3.6 Table Component

**إنشاء `src/components/ui/Table.jsx`:**

```jsx
import { cn } from '@/utils/cn'

/**
 * Table component with compound pattern
 * 
 * @example
 * <Table>
 *   <Table.Header>
 *     <Table.Row>
 *       <Table.Head>Name</Table.Head>
 *       <Table.Head>Status</Table.Head>
 *     </Table.Row>
 *   </Table.Header>
 *   <Table.Body>
 *     <Table.Row>
 *       <Table.Cell>Project A</Table.Cell>
 *       <Table.Cell><Badge>Active</Badge></Table.Cell>
 *     </Table.Row>
 *   </Table.Body>
 * </Table>
 */
function Table({ className, children, ...props }) {
  return (
    <div className={cn('w-full overflow-auto', className)}>
      <table className="w-full caption-bottom text-sm" {...props}>
        {children}
      </table>
    </div>
  )
}

function TableHeader({ className, children, ...props }) {
  return (
    <thead className={cn('[&_tr]:border-b', className)} {...props}>
      {children}
    </thead>
  )
}

function TableBody({ className, children, ...props }) {
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props}>
      {children}
    </tbody>
  )
}

function TableFooter({ className, children, ...props }) {
  return (
    <tfoot
      className={cn(
        'border-t bg-background/50 dark:bg-background-dark/50 font-medium',
        className
      )}
      {...props}
    >
      {children}
    </tfoot>
  )
}

function TableRow({ className, children, isSelected, isClickable, ...props }) {
  return (
    <tr
      className={cn(
        'border-b border-border-default dark:border-border-dark',
        'transition-colors',
        'hover:bg-background/50 dark:hover:bg-surface-dark/50',
        isSelected && 'bg-primary/5 dark:bg-primary/10',
        isClickable && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  )
}

function TableHead({ className, children, sortable, sortDirection, onSort, ...props }) {
  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle font-semibold',
        'text-text-main dark:text-white',
        'bg-background dark:bg-background-dark',
        sortable && 'cursor-pointer select-none hover:bg-background dark:hover:bg-surface-dark',
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && (
          <span className="material-symbols-outlined text-base text-text-muted">
            {sortDirection === 'asc' ? 'arrow_upward' : 
             sortDirection === 'desc' ? 'arrow_downward' : 'unfold_more'}
          </span>
        )}
      </div>
    </th>
  )
}

function TableCell({ className, children, ...props }) {
  return (
    <td
      className={cn(
        'p-4 align-middle',
        'text-text-main dark:text-gray-200',
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
}

function TableCaption({ className, children, ...props }) {
  return (
    <caption
      className={cn('mt-4 text-sm text-text-secondary dark:text-gray-400', className)}
      {...props}
    >
      {children}
    </caption>
  )
}

// Empty state
function TableEmpty({ message = 'No data available', className, ...props }) {
  return (
    <tr>
      <td colSpan="100%" className={cn('py-12 text-center', className)} {...props}>
        <div className="flex flex-col items-center gap-2 text-text-muted dark:text-gray-500">
          <span className="material-symbols-outlined text-4xl">inbox</span>
          <p>{message}</p>
        </div>
      </td>
    </tr>
  )
}

Table.Header = TableHeader
Table.Body = TableBody
Table.Footer = TableFooter
Table.Row = TableRow
Table.Head = TableHead
Table.Cell = TableCell
Table.Caption = TableCaption
Table.Empty = TableEmpty

export default Table
```

### 3.7 Tooltip Component

**إنشاء `src/components/ui/Tooltip.jsx`:**

```jsx
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'

/**
 * Tooltip component
 * 
 * @param {Object} props
 * @param {string|React.ReactNode} props.content - Tooltip content
 * @param {'top'|'bottom'|'left'|'right'} props.position - Tooltip position
 * @param {number} props.delay - Show delay in ms
 * 
 * @example
 * <Tooltip content="Edit project">
 *   <Button variant="ghost"><Icon name="edit" /></Button>
 * </Tooltip>
 */
function Tooltip({
  content,
  position = 'top',
  delay = 200,
  className,
  children,
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const timeoutRef = useRef(null)

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        const scrollX = window.scrollX
        const scrollY = window.scrollY

        let top, left

        switch (position) {
          case 'top':
            top = rect.top + scrollY - 8
            left = rect.left + scrollX + rect.width / 2
            break
          case 'bottom':
            top = rect.bottom + scrollY + 8
            left = rect.left + scrollX + rect.width / 2
            break
          case 'left':
            top = rect.top + scrollY + rect.height / 2
            left = rect.left + scrollX - 8
            break
          case 'right':
            top = rect.top + scrollY + rect.height / 2
            left = rect.right + scrollX + 8
            break
          default:
            top = rect.top + scrollY - 8
            left = rect.left + scrollX + rect.width / 2
        }

        setCoords({ top, left })
        setIsVisible(true)
      }
    }, delay)
  }

  const hideTooltip = () => {
    clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  const positionClasses = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left: '-translate-x-full -translate-y-1/2',
    right: '-translate-y-1/2',
  }

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-flex"
      >
        {children}
      </span>

      {isVisible && createPortal(
        <div
          role="tooltip"
          style={{ top: coords.top, left: coords.left }}
          className={cn(
            'fixed z-50 pointer-events-none',
            'px-3 py-1.5 rounded-lg',
            'bg-gray-900 dark:bg-gray-700 text-white',
            'text-sm font-medium shadow-lg',
            'animate-fade-in',
            positionClasses[position],
            className
          )}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  )
}

export default Tooltip
```

### 3.8 Dropdown Component

**إنشاء `src/components/ui/Dropdown.jsx`:**

```jsx
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/utils/cn'

/**
 * Dropdown menu component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.trigger - Trigger element
 * @param {Array<{label: string, icon?: string, onClick?: Function, divider?: boolean, disabled?: boolean}>} props.items
 * @param {'left'|'right'} props.align - Menu alignment
 * 
 * @example
 * <Dropdown
 *   trigger={<Button variant="ghost"><Icon name="more_vert" /></Button>}
 *   items={[
 *     { label: 'Edit', icon: 'edit', onClick: handleEdit },
 *     { label: 'Delete', icon: 'delete', onClick: handleDelete },
 *   ]}
 * />
 */
function Dropdown({
  trigger,
  items = [],
  align = 'right',
  className,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleItemClick = (item) => {
    if (!item.disabled) {
      item.onClick?.()
      setIsOpen(false)
    }
  }

  return (
    <div ref={dropdownRef} className={cn('relative inline-block', className)}>
      {/* Trigger */}
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {/* Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1 min-w-[180px]',
            'bg-surface dark:bg-surface-dark',
            'border border-border-default dark:border-border-dark',
            'rounded-lg shadow-lg',
            'py-1 animate-slide-in',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, index) => (
            item.divider ? (
              <div
                key={index}
                className="my-1 border-t border-border-default dark:border-border-dark"
              />
            ) : (
              <button
                key={index}
                type="button"
                disabled={item.disabled}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2',
                  'text-sm text-left',
                  'transition-colors',
                  item.disabled
                    ? 'opacity-50 cursor-not-allowed text-text-muted'
                    : 'text-text-main dark:text-white hover:bg-background dark:hover:bg-background-dark',
                  item.danger && !item.disabled && 'text-error hover:bg-error/10'
                )}
              >
                {item.icon && (
                  <span className="material-symbols-outlined text-xl">
                    {item.icon}
                  </span>
                )}
                {item.label}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  )
}

export default Dropdown
```

---

## الخطوة 4: مكونات Navigation

### 4.1 Breadcrumb Component

**إنشاء `src/components/ui/Breadcrumb.jsx`:**

```jsx
import { cn } from '@/utils/cn'

/**
 * Breadcrumb navigation component
 * 
 * @param {Object} props
 * @param {Array<{label: string, href?: string, icon?: string}>} props.items
 * @param {string} props.separator - Separator character/icon
 * 
 * @example
 * <Breadcrumb items={[
 *   { label: 'Dashboard', href: '/app/dashboard' },
 *   { label: 'Projects', href: '/app/projects' },
 *   { label: 'Project A' }
 * ]} />
 */
function Breadcrumb({
  items = [],
  separator = 'chevron_right',
  className,
  ...props
}) {
  return (
    <nav aria-label="Breadcrumb" className={className} {...props}>
      <ol className="flex items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center gap-1">
              {/* Separator */}
              {index > 0 && (
                <span className="material-symbols-outlined text-base text-text-muted dark:text-gray-500">
                  {separator}
                </span>
              )}

              {/* Item */}
              {isLast || !item.href ? (
                <span
                  className={cn(
                    'flex items-center gap-1.5',
                    isLast
                      ? 'text-text-main dark:text-white font-medium'
                      : 'text-text-secondary dark:text-gray-400'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon && (
                    <span className="material-symbols-outlined text-base">
                      {item.icon}
                    </span>
                  )}
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5',
                    'text-text-secondary dark:text-gray-400',
                    'hover:text-text-main dark:hover:text-white',
                    'transition-colors'
                  )}
                >
                  {item.icon && (
                    <span className="material-symbols-outlined text-base">
                      {item.icon}
                    </span>
                  )}
                  {item.label}
                </a>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumb
```

### 4.2 ProgressBar Component

**إنشاء `src/components/ui/ProgressBar.jsx`:**

```jsx
import { cn } from '@/utils/cn'

/**
 * Progress bar component
 * 
 * @param {Object} props
 * @param {number} props.value - Current value (0-100)
 * @param {number} props.max - Maximum value
 * @param {'sm'|'md'|'lg'} props.size - Bar height
 * @param {'default'|'success'|'warning'|'error'|'primary'} props.variant
 * @param {boolean} props.showLabel - Show percentage label
 * @param {boolean} props.animated - Animate progress bar
 * @param {string} props.label - Custom label
 * 
 * @example
 * <ProgressBar value={75} showLabel />
 * <ProgressBar value={30} variant="warning" size="lg" />
 */
function ProgressBar({
  value = 0,
  max = 100,
  size = 'md',
  variant = 'primary',
  showLabel = false,
  animated = false,
  label,
  className,
  ...props
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }

  const variants = {
    default: 'bg-gray-500',
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  }

  return (
    <div className={cn('w-full', className)} {...props}>
      {/* Label */}
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && (
            <span className="text-sm font-medium text-text-main dark:text-white">
              {label}
            </span>
          )}
          {showLabel && (
            <span className="text-sm text-text-secondary dark:text-gray-400">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      {/* Progress track */}
      <div
        className={cn(
          'w-full rounded-full overflow-hidden',
          'bg-gray-200 dark:bg-gray-700',
          sizes[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        {/* Progress fill */}
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            variants[variant],
            animated && 'animate-pulse'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
```

### 4.3 ProgressStepper Component

**إنشاء `src/components/ui/ProgressStepper.jsx`:**

```jsx
import { cn } from '@/utils/cn'

/**
 * Progress stepper for multi-step workflows
 * 
 * @param {Object} props
 * @param {Array<{id: string, label: string, description?: string, icon?: string}>} props.steps
 * @param {number} props.currentStep - Current step index (0-based)
 * @param {'horizontal'|'vertical'} props.orientation
 * @param {Function} props.onStepClick - Step click handler (optional)
 * 
 * @example
 * <ProgressStepper
 *   steps={[
 *     { id: 'screening', label: 'Screening', description: 'Risk assessment' },
 *     { id: 'assessment', label: 'Assessment', description: 'Impact evaluation' },
 *     { id: 'monitoring', label: 'Monitoring', description: 'Track progress' },
 *   ]}
 *   currentStep={1}
 * />
 */
function ProgressStepper({
  steps = [],
  currentStep = 0,
  orientation = 'horizontal',
  onStepClick,
  className,
  ...props
}) {
  const isHorizontal = orientation === 'horizontal'

  return (
    <div
      className={cn(
        'flex',
        isHorizontal ? 'flex-row items-start' : 'flex-col',
        className
      )}
      {...props}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isClickable = onStepClick && (isCompleted || isCurrent)

        return (
          <div
            key={step.id}
            className={cn(
              'flex',
              isHorizontal ? 'flex-1 flex-col items-center' : 'flex-row items-start gap-4'
            )}
          >
            {/* Step indicator */}
            <div className={cn('flex items-center', isHorizontal ? 'w-full' : 'flex-col')}>
              {/* Line before */}
              {index > 0 && (
                <div
                  className={cn(
                    isHorizontal ? 'flex-1 h-0.5' : 'w-0.5 h-8 -mt-8',
                    isCompleted ? 'bg-primary' : 'bg-border-default dark:bg-border-dark'
                  )}
                />
              )}

              {/* Circle */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  'relative flex items-center justify-center',
                  'w-10 h-10 rounded-full',
                  'border-2 transition-all duration-200',
                  'flex-shrink-0',
                  isCompleted && 'bg-primary border-primary text-white',
                  isCurrent && 'border-primary bg-primary/10 text-primary',
                  !isCompleted && !isCurrent && 'border-border-default dark:border-border-dark text-text-muted',
                  isClickable && 'cursor-pointer hover:shadow-md',
                  !isClickable && 'cursor-default'
                )}
              >
                {isCompleted ? (
                  <span className="material-symbols-outlined text-xl">check</span>
                ) : step.icon ? (
                  <span className="material-symbols-outlined text-xl">{step.icon}</span>
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </button>

              {/* Line after */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    isHorizontal ? 'flex-1 h-0.5' : 'w-0.5 h-8',
                    isCompleted ? 'bg-primary' : 'bg-border-default dark:bg-border-dark'
                  )}
                />
              )}
            </div>

            {/* Label and description */}
            <div
              className={cn(
                isHorizontal ? 'mt-3 text-center' : 'flex-1 pb-8',
                isHorizontal && index === steps.length - 1 && 'mr-0',
              )}
            >
              <p
                className={cn(
                  'text-sm font-medium',
                  isCurrent || isCompleted
                    ? 'text-text-main dark:text-white'
                    : 'text-text-muted dark:text-gray-500'
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-text-secondary dark:text-gray-400 mt-0.5">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ProgressStepper
```

### 4.4 Pagination Component

**إنشاء `src/components/ui/Pagination.jsx`:**

```jsx
import { cn } from '@/utils/cn'

/**
 * Pagination component
 * 
 * @param {Object} props
 * @param {number} props.currentPage - Current page (1-based)
 * @param {number} props.totalPages - Total number of pages
 * @param {Function} props.onPageChange - Page change handler
 * @param {number} props.siblingCount - Pages to show on each side of current
 * @param {boolean} props.showFirstLast - Show first/last page buttons
 * 
 * @example
 * <Pagination currentPage={5} totalPages={20} onPageChange={setPage} />
 */
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  className,
  ...props
}) {
  const range = (start, end) => {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const getPageNumbers = () => {
    const totalPageNumbers = siblingCount * 2 + 5 // siblings + first + last + current + 2 dots

    if (totalPageNumbers >= totalPages) {
      return range(1, totalPages)
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)

    const shouldShowLeftDots = leftSiblingIndex > 2
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount
      const leftRange = range(1, leftItemCount)
      return [...leftRange, '...', totalPages]
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount
      const rightRange = range(totalPages - rightItemCount + 1, totalPages)
      return [1, '...', ...rightRange]
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex)
      return [1, '...', ...middleRange, '...', totalPages]
    }

    return range(1, totalPages)
  }

  const pages = getPageNumbers()

  const buttonClasses = cn(
    'flex items-center justify-center',
    'w-9 h-9 rounded-lg',
    'text-sm font-medium',
    'transition-colors duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  )

  return (
    <nav
      className={cn('flex items-center gap-1', className)}
      aria-label="Pagination"
      {...props}
    >
      {/* First page */}
      {showFirstLast && (
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={cn(
            buttonClasses,
            'text-text-secondary dark:text-gray-400',
            'hover:bg-background dark:hover:bg-surface-dark'
          )}
          aria-label="First page"
        >
          <span className="material-symbols-outlined text-lg">first_page</span>
        </button>
      )}

      {/* Previous */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          buttonClasses,
          'text-text-secondary dark:text-gray-400',
          'hover:bg-background dark:hover:bg-surface-dark'
        )}
        aria-label="Previous page"
      >
        <span className="material-symbols-outlined text-lg">chevron_left</span>
      </button>

      {/* Page numbers */}
      {pages.map((page, index) => (
        page === '...' ? (
          <span
            key={`dots-${index}`}
            className="w-9 h-9 flex items-center justify-center text-text-muted"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={cn(
              buttonClasses,
              page === currentPage
                ? 'bg-primary text-white'
                : 'text-text-main dark:text-white hover:bg-background dark:hover:bg-surface-dark'
            )}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        )
      ))}

      {/* Next */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          buttonClasses,
          'text-text-secondary dark:text-gray-400',
          'hover:bg-background dark:hover:bg-surface-dark'
        )}
        aria-label="Next page"
      >
        <span className="material-symbols-outlined text-lg">chevron_right</span>
      </button>

      {/* Last page */}
      {showFirstLast && (
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={cn(
            buttonClasses,
            'text-text-secondary dark:text-gray-400',
            'hover:bg-background dark:hover:bg-surface-dark'
          )}
          aria-label="Last page"
        >
          <span className="material-symbols-outlined text-lg">last_page</span>
        </button>
      )}
    </nav>
  )
}

export default Pagination
```

### 4.5 Accordion Component

**إنشاء `src/components/ui/Accordion.jsx`:**

```jsx
import { useState, createContext, useContext } from 'react'
import { cn } from '@/utils/cn'

const AccordionContext = createContext(null)

/**
 * Accordion component for collapsible sections
 * 
 * @param {Object} props
 * @param {string|string[]} props.defaultOpen - Initially open item(s)
 * @param {boolean} props.allowMultiple - Allow multiple items open
 * @param {Function} props.onChange - Change handler
 * 
 * @example
 * <Accordion defaultOpen="item-1">
 *   <Accordion.Item value="item-1">
 *     <Accordion.Trigger>Section 1</Accordion.Trigger>
 *     <Accordion.Content>Content 1...</Accordion.Content>
 *   </Accordion.Item>
 *   <Accordion.Item value="item-2">
 *     <Accordion.Trigger>Section 2</Accordion.Trigger>
 *     <Accordion.Content>Content 2...</Accordion.Content>
 *   </Accordion.Item>
 * </Accordion>
 */
function Accordion({
  defaultOpen = [],
  allowMultiple = false,
  onChange,
  className,
  children,
  ...props
}) {
  const [openItems, setOpenItems] = useState(() => {
    if (Array.isArray(defaultOpen)) return defaultOpen
    return defaultOpen ? [defaultOpen] : []
  })

  const toggleItem = (value) => {
    setOpenItems((prev) => {
      let newItems
      if (prev.includes(value)) {
        newItems = prev.filter((item) => item !== value)
      } else {
        newItems = allowMultiple ? [...prev, value] : [value]
      }
      onChange?.(newItems)
      return newItems
    })
  }

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div
        className={cn('divide-y divide-border-default dark:divide-border-dark', className)}
        {...props}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

const AccordionItemContext = createContext(null)

function AccordionItem({ value, disabled = false, className, children, ...props }) {
  const { openItems } = useContext(AccordionContext)
  const isOpen = openItems.includes(value)

  return (
    <AccordionItemContext.Provider value={{ value, isOpen, disabled }}>
      <div
        className={cn(disabled && 'opacity-50', className)}
        data-state={isOpen ? 'open' : 'closed'}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  )
}

function AccordionTrigger({ className, children, ...props }) {
  const { toggleItem } = useContext(AccordionContext)
  const { value, isOpen, disabled } = useContext(AccordionItemContext)

  return (
    <button
      type="button"
      onClick={() => !disabled && toggleItem(value)}
      disabled={disabled}
      className={cn(
        'flex items-center justify-between w-full py-4 px-1',
        'text-left font-medium',
        'text-text-main dark:text-white',
        'hover:text-primary dark:hover:text-primary',
        'transition-colors',
        disabled && 'cursor-not-allowed',
        className
      )}
      aria-expanded={isOpen}
      {...props}
    >
      {children}
      <span
        className={cn(
          'material-symbols-outlined text-xl text-text-muted',
          'transition-transform duration-200',
          isOpen && 'rotate-180'
        )}
      >
        expand_more
      </span>
    </button>
  )
}

function AccordionContent({ className, children, ...props }) {
  const { isOpen } = useContext(AccordionItemContext)

  return (
    <div
      className={cn(
        'overflow-hidden transition-all duration-200',
        isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
      )}
      role="region"
      {...props}
    >
      <div className={cn('pb-4 px-1 text-text-secondary dark:text-gray-400', className)}>
        {children}
      </div>
    </div>
  )
}

Accordion.Item = AccordionItem
Accordion.Trigger = AccordionTrigger
Accordion.Content = AccordionContent

export default Accordion
```

---

## الخطوة 5: تحديث Barrel Exports

### 5.1 تحديث `src/components/ui/index.js`

```javascript
// UI Components Barrel Export

// Helpers
export { default as LoadingSpinner } from './LoadingSpinner'
export { default as Icon } from './Icon'

// Form Controls
export { default as Button } from './Button'
export { default as Input } from './Input'
export { default as Textarea } from './Textarea'
export { default as Select } from './Select'
export { default as Checkbox } from './Checkbox'
export { default as RadioGroup } from './RadioGroup'
export { default as FileUpload } from './FileUpload'

// Display Components
export { default as Card } from './Card'
export { default as Badge } from './Badge'
export { default as Avatar } from './Avatar'
export { default as Alert } from './Alert'
export { default as Table } from './Table'
export { default as Modal } from './Modal'
export { default as Tooltip } from './Tooltip'
export { default as Dropdown } from './Dropdown'

// Navigation Components
export { default as Breadcrumb } from './Breadcrumb'
export { default as ProgressBar } from './ProgressBar'
export { default as ProgressStepper } from './ProgressStepper'
export { default as Pagination } from './Pagination'
export { default as Accordion } from './Accordion'
```

---

## الخطوة 6: إنشاء صفحة عرض المكونات (Component Showcase)

**إنشاء `src/pages/ComponentShowcase.jsx`:**

```jsx
import { useState } from 'react'
import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  RadioGroup,
  Card,
  Badge,
  Avatar,
  Alert,
  Modal,
  Tooltip,
  Dropdown,
  Breadcrumb,
  ProgressBar,
  ProgressStepper,
  Pagination,
  Accordion,
  Icon,
} from '@/components/ui'
import { useTheme } from '@/contexts'

function ComponentShowcase() {
  const { toggleTheme, isDark } = useTheme()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [radioValue, setRadioValue] = useState('a')

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark p-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-text-main dark:text-white">
            Component Library
          </h1>
          <Button variant="ghost" onClick={toggleTheme}>
            <Icon name={isDark ? 'light_mode' : 'dark_mode'} />
          </Button>
        </div>

        {/* Buttons */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-text-main dark:text-white">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button isLoading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        {/* Form Controls */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-text-main dark:text-white">Form Controls</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Input label="Email" type="email" placeholder="name@example.com" />
            <Input label="With Error" error="This field is required" />
            <Textarea label="Description" placeholder="Enter description..." />
            <Select
              label="Category"
              options={[
                { value: 'a', label: 'Category A' },
                { value: 'b', label: 'Category B' },
              ]}
            />
          </div>
          <div className="mt-4 space-y-4">
            <Checkbox label="I agree to the terms" description="You must agree to continue" />
            <RadioGroup
              name="risk"
              value={radioValue}
              onChange={setRadioValue}
              label="Risk Category"
            >
              <RadioGroup.Item value="a" label="Category A" description="High Risk" />
              <RadioGroup.Item value="b" label="Category B" description="Medium Risk" />
            </RadioGroup>
          </div>
        </section>

        {/* Badges */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-text-main dark:text-white">Badges</h2>
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning" dot>Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="primary">Primary</Badge>
          </div>
        </section>

        {/* Alerts */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-text-main dark:text-white">Alerts</h2>
          <div className="space-y-3">
            <Alert variant="info" title="Information">This is an info message.</Alert>
            <Alert variant="success" title="Success" dismissible>Operation completed.</Alert>
            <Alert variant="warning">Warning message without title.</Alert>
            <Alert variant="error" title="Error">Something went wrong.</Alert>
          </div>
        </section>

        {/* Cards */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-text-main dark:text-white">Cards</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <Card.Header>
                <Card.Title>Project Overview</Card.Title>
                <Card.Description>View project details and status</Card.Description>
              </Card.Header>
              <Card.Body>
                <p className="text-text-secondary dark:text-gray-400">Card content goes here...</p>
              </Card.Body>
              <Card.Footer>
                <Button size="sm">View Details</Button>
              </Card.Footer>
            </Card>
          </div>
        </section>

        {/* Avatar */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-text-main dark:text-white">Avatars</h2>
          <div className="flex gap-4 items-end">
            <Avatar size="xs" fallback="XS" />
            <Avatar size="sm" fallback="SM" />
            <Avatar size="md" fallback="MD" status="online" />
            <Avatar size="lg" fallback="LG" status="away" />
            <Avatar size="xl" fallback="XL" status="busy" />
          </div>
        </section>

        {/* Progress */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-text-main dark:text-white">Progress</h2>
          <div className="space-y-4">
            <ProgressBar value={75} showLabel label="Project Progress" />
            <ProgressBar value={30} variant="warning" size="lg" />
          </div>
          <div className="mt-6">
            <ProgressStepper
              steps={[
                { id: '1', label: 'Screening', description: 'Risk assessment' },
                { id: '2', label: 'Assessment', description: 'Impact evaluation' },
                { id: '3', label: 'SEMP', description: 'Management plan' },
                { id: '4', label: 'Monitoring', description: 'Track progress' },
              ]}
              currentStep={1}
            />
          </div>
        </section>

        {/* Pagination */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-text-main dark:text-white">Pagination</h2>
          <Pagination
            currentPage={currentPage}
            totalPages={20}
            onPageChange={setCurrentPage}
          />
        </section>

        {/* Modal */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-text-main dark:text-white">Modal</h2>
          <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Confirm Action"
            description="Are you sure you want to proceed?"
          >
            <p className="text-text-secondary dark:text-gray-400">
              This action cannot be undone.
            </p>
            <Modal.Footer>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={() => setIsModalOpen(false)}>Confirm</Button>
            </Modal.Footer>
          </Modal>
        </section>

        {/* Accordion */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-text-main dark:text-white">Accordion</h2>
          <Accordion defaultOpen="section-1">
            <Accordion.Item value="section-1">
              <Accordion.Trigger>Section 1</Accordion.Trigger>
              <Accordion.Content>Content for section 1...</Accordion.Content>
            </Accordion.Item>
            <Accordion.Item value="section-2">
              <Accordion.Trigger>Section 2</Accordion.Trigger>
              <Accordion.Content>Content for section 2...</Accordion.Content>
            </Accordion.Item>
          </Accordion>
        </section>
      </div>
    </div>
  )
}

export default ComponentShowcase
```

---

## الخطوة 7: اختبار المكونات

### 7.1 تحديث App.jsx لعرض صفحة المكونات

**تحديث `src/App.jsx`:**

```jsx
import ComponentShowcase from '@/pages/ComponentShowcase'

function App() {
  return <ComponentShowcase />
}

export default App
```

### 7.2 تشغيل التطبيق والاختبار

```bash
npm run dev
```

**قائمة الاختبار:**

| المكون | اختبار Light Mode | اختبار Dark Mode | اختبار التفاعل |
|--------|------------------|------------------|----------------|
| Button | ☐ | ☐ | ☐ Click, Hover, Disabled |
| Input | ☐ | ☐ | ☐ Focus, Error |
| Textarea | ☐ | ☐ | ☐ Resize |
| Select | ☐ | ☐ | ☐ Options |
| Checkbox | ☐ | ☐ | ☐ Check/Uncheck |
| RadioGroup | ☐ | ☐ | ☐ Selection |
| Card | ☐ | ☐ | ☐ |
| Badge | ☐ | ☐ | ☐ Variants |
| Avatar | ☐ | ☐ | ☐ Fallback |
| Alert | ☐ | ☐ | ☐ Dismiss |
| Modal | ☐ | ☐ | ☐ Open/Close |
| Table | ☐ | ☐ | ☐ |
| Tooltip | ☐ | ☐ | ☐ Hover |
| Dropdown | ☐ | ☐ | ☐ Click |
| Breadcrumb | ☐ | ☐ | ☐ |
| ProgressBar | ☐ | ☐ | ☐ |
| ProgressStepper | ☐ | ☐ | ☐ Steps |
| Pagination | ☐ | ☐ | ☐ Navigation |
| Accordion | ☐ | ☐ | ☐ Expand/Collapse |

---

## قائمة التحقق النهائية (Checklist)

### ملفات يجب أن تكون موجودة:

```
✓ src/components/ui/
  ✓ index.js (Barrel exports)
  ✓ LoadingSpinner.jsx
  ✓ Icon.jsx
  ✓ Button.jsx
  ✓ Input.jsx
  ✓ Textarea.jsx
  ✓ Select.jsx
  ✓ Checkbox.jsx
  ✓ RadioGroup.jsx
  ✓ FileUpload.jsx
  ✓ Card.jsx
  ✓ Badge.jsx
  ✓ Avatar.jsx
  ✓ Alert.jsx
  ✓ Table.jsx
  ✓ Modal.jsx
  ✓ Tooltip.jsx
  ✓ Dropdown.jsx
  ✓ Breadcrumb.jsx
  ✓ ProgressBar.jsx
  ✓ ProgressStepper.jsx
  ✓ Pagination.jsx
  ✓ Accordion.jsx

✓ src/pages/
  ✓ ComponentShowcase.jsx
```

### معايير الجودة:

| المعيار | الوصف | الحالة |
|---------|-------|--------|
| **Dark Mode** | جميع المكونات تدعم الوضع المظلم | ☐ |
| **Accessibility** | ARIA labels, keyboard navigation | ☐ |
| **JSDoc** | توثيق Props لكل مكون | ☐ |
| **Variants** | دعم متغيرات متعددة عبر Props | ☐ |
| **Responsive** | تعمل على جميع أحجام الشاشات | ☐ |
| **ESLint** | لا أخطاء في ESLint | ☐ |
| **Prettier** | الكود منسق بشكل صحيح | ☐ |

---

## ملاحظات مهمة

### 1. أنماط التصميم المستخدمة

- **Compound Components**: للمكونات المركبة مثل Card, Table, Accordion
- **forwardRef**: للمكونات التي تحتاج ref forwarding مثل Button, Input
- **Context API**: لـ RadioGroup و Accordion

### 2. Accessibility (إمكانية الوصول)

- جميع الحقول لها `label` مرتبط
- الأزرار لها `aria-label` عند الحاجة
- دعم التنقل بلوحة المفاتيح
- حالات Focus واضحة

### 3. أفضل الممارسات

- استخدام `cn()` لدمج الـ classes
- دعم `className` prop لكل مكون
- استخدام `...props` لتمرير props إضافية
- تسمية متسقة للـ Props (isLoading, isDisabled, etc.)

---

## الخطوة التالية

بعد إكمال Phase 2 بنجاح، انتقل إلى **Phase 3: Layout Components & Routing** حيث ستقوم بـ:
- بناء AuthLayout, MainLayout, ProjectLayout
- إنشاء Header, Sidebar components
- تكوين React Router
- إعداد الـ Routes

---

## حالة التنفيذ

### ✅ تم التنفيذ بنجاح

**تاريخ الإنجاز:** 23 يناير 2026

**الملفات المُنشأة:**
- ✅ `src/components/ui/Icon.jsx` - Icon wrapper component
- ✅ `src/components/ui/Button.jsx` - Button component مع جميع الـ variants
- ✅ `src/components/ui/Input.jsx` - Input component مع label و validation
- ✅ `src/components/ui/Textarea.jsx` - Textarea component
- ✅ `src/components/ui/Select.jsx` - Select dropdown component
- ✅ `src/components/ui/Checkbox.jsx` - Checkbox component
- ✅ `src/components/ui/RadioGroup.jsx` - RadioGroup component مع Context API
- ✅ `src/components/ui/FileUpload.jsx` - FileUpload component مع drag & drop
- ✅ `src/components/ui/Card.jsx` - Card component مع compound pattern
- ✅ `src/components/ui/Badge.jsx` - Badge component
- ✅ `src/components/ui/Avatar.jsx` - Avatar component مع fallback
- ✅ `src/components/ui/Alert.jsx` - Alert/Banner component
- ✅ `src/components/ui/Table.jsx` - Table component مع compound pattern
- ✅ `src/components/ui/Modal.jsx` - Modal/Dialog component
- ✅ `src/components/ui/Tooltip.jsx` - Tooltip component
- ✅ `src/components/ui/Dropdown.jsx` - Dropdown menu component
- ✅ `src/components/ui/Breadcrumb.jsx` - Breadcrumb navigation component
- ✅ `src/components/ui/ProgressBar.jsx` - Progress bar component
- ✅ `src/components/ui/ProgressStepper.jsx` - Progress stepper component
- ✅ `src/components/ui/Pagination.jsx` - Pagination component
- ✅ `src/components/ui/Accordion.jsx` - Accordion component
- ✅ `src/components/ui/index.js` - Barrel exports محدثة
- ✅ `src/pages/ComponentShowcase.jsx` - صفحة عرض جميع المكونات
- ✅ `src/App.jsx` - محدث لعرض ComponentShowcase

**المكونات المُنشأة:**
- ✅ 20 مكون UI مشترك (18 مكون مطلوب + LoadingSpinner + Icon)
- ✅ جميع المكونات تدعم Dark Mode
- ✅ جميع المكونات موثقة بـ JSDoc
- ✅ Barrel Exports محدثة في `src/components/ui/index.js`
- ✅ صفحة ComponentShowcase لعرض واختبار جميع المكونات

**الاختبارات المُنفذة:**
- ✅ جميع المكونات تعمل في Light Mode
- ✅ جميع المكونات تعمل في Dark Mode
- ✅ التفاعلات الأساسية تعمل (hover, focus, click)
- ✅ Build يعمل بدون أخطاء

**الملاحظات:**
- جميع المكونات تستخدم `cn()` utility لدمج classes
- جميع المكونات تدعم `className` prop للتخصيص
- المكونات المركبة (Card, Table, Accordion, RadioGroup) تستخدم Compound Components pattern
- Modal و Tooltip يستخدمان `createPortal` للعرض
- جميع المكونات متوافقة مع Accessibility (ARIA labels, keyboard navigation)

**جاهز للمرحلة التالية:**
المشروع جاهز الآن لبدء Phase 3 (Layout Components & Routing).

---

*تم إنشاء هذه الخطة: 22 يناير 2026*
*تم التنفيذ: 23 يناير 2026*
*الإصدار: 1.0 - مكتمل*
