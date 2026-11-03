import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('joins class names and drops falsy values', () => {
    expect(cn('px-4', false, null, undefined, 'py-2')).toBe('px-4 py-2')
  })

  it('applies conditional object syntax', () => {
    expect(cn('text-base', { 'font-bold': true, italic: false })).toBe('text-base font-bold')
  })

  it('lets later Tailwind classes override conflicting earlier ones', () => {
    expect(cn('px-4 bg-primary', 'px-2')).toBe('bg-primary px-2')
  })
})
