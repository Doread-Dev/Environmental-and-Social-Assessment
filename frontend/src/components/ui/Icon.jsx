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
    sm: 'text-lg', // 18px
    md: 'text-xl', // 20px
    lg: 'text-2xl', // 24px
    xl: 'text-3xl', // 30px
  }

  // Check if className contains a custom text size class
  const hasCustomSize =
    className &&
    /text-\[[^\]]+\]|text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/.test(className)

  return (
    <span
      className={cn(
        filled ? 'material-symbols-filled' : 'material-symbols-outlined',
        'select-none',
        !hasCustomSize && sizes[size],
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
