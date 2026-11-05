/**
 * Shared look of every form control (Input, Select, Textarea, and the few raw controls that
 * cannot use them, such as contentEditable table cells). One place for borders, background,
 * focus ring, error and disabled states, in light and dark mode (D71).
 */
import { cn } from '@/utils/cn'

/** Heights and text sizes; `md` matches the medium Button (h-10, text-sm). */
export const CONTROL_SIZES = {
  sm: 'h-9 text-sm',
  md: 'h-10 text-sm',
  lg: 'h-11 text-base',
}

/** Label above a control. */
export const LABEL_CLASSES = 'text-sm font-semibold text-text-main dark:text-gray-200'

/** Error line below a control. */
export const ERROR_TEXT_CLASSES = 'text-sm text-error flex items-center gap-1'

/** Helper line below a control. */
export const HELPER_TEXT_CLASSES = 'text-sm text-text-secondary dark:text-gray-400'

/** Visible keyboard focus for clickable elements that are not form controls. */
export const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background-dark'

/**
 * Classes of a form control.
 *
 * @param {Object} [options]
 * @param {'default'|'cell'} [options.variant] - `default`: bordered field; `cell`: borderless
 *   control inside a table cell that shows its border on hover and focus
 * @param {boolean} [options.error] - Error state (red border and ring)
 * @returns {string}
 */
export function controlClasses({ variant = 'default', error = false } = {}) {
  if (variant === 'cell') {
    return cn(
      'w-full rounded border border-transparent bg-transparent',
      'text-sm text-text-main dark:text-white',
      'placeholder:text-text-secondary/70 dark:placeholder:text-gray-500',
      'transition-colors hover:bg-primary/5',
      'focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50',
      'focus:bg-surface dark:focus:bg-surface-dark',
      'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-transparent',
      error && 'border-error'
    )
  }

  return cn(
    'w-full rounded-lg border',
    'bg-surface dark:bg-black/20',
    'text-text-main dark:text-white',
    'placeholder:text-text-secondary/70 dark:placeholder:text-gray-500',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2',
    error
      ? 'border-error focus:border-error focus:ring-error/20'
      : 'border-input-border dark:border-input-border-dark focus:border-primary focus:ring-primary/20',
    'disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-background dark:disabled:bg-white/5'
  )
}

/**
 * Read-only text fields (Input/Textarea with `readOnly`) look like a filled, locked field.
 * Not part of `controlClasses`: CSS `:read-only` also matches every select element.
 */
export const READ_ONLY_CLASSES =
  'read-only:bg-background dark:read-only:bg-white/5 read-only:cursor-default read-only:focus:ring-0 read-only:focus:border-input-border dark:read-only:focus:border-input-border-dark'
