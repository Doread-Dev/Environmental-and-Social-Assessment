import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes with tailwind-merge for deduplication
 *
 * @param {...(string|object|array)} inputs - Class names or conditional objects
 * @returns {string} - Merged class string
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-primary', className)
 * cn('text-base', { 'text-lg': isLarge, 'text-sm': isSmall })
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
