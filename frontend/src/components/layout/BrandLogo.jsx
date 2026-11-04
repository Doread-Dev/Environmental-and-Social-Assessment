/**
 * BrandLogo Component
 * The AKF emblem with the product name, used wherever the app shows its brand (sidebar,
 * headers, mobile menu). Local asset (works offline); no box or glow behind the emblem, so it
 * reads on the light and the dark surfaces alike.
 */

import akfMark from '@/assets/brand/akf-mark.png'
import { cn } from '@/utils/cn'

const SIZES = {
  sm: { mark: 'h-8', title: 'text-base', gap: 'gap-2.5' },
  md: { mark: 'h-10', title: 'text-lg', gap: 'gap-3' },
  lg: { mark: 'h-12', title: 'text-lg', gap: 'gap-3' },
}

/**
 * @param {Object} props
 * @param {'sm'|'md'|'lg'} [props.size]
 * @param {boolean} [props.showText] - Product name next to the emblem
 * @param {boolean} [props.showSubtitle] - "Aga Khan Foundation – Syria" under the name
 * @param {string} [props.textClassName] - e.g. 'hidden sm:flex' to hide the name on phones
 */
export default function BrandLogo({
  size = 'md',
  showText = true,
  showSubtitle = true,
  textClassName,
  className,
}) {
  const s = SIZES[size] ?? SIZES.md
  return (
    <div className={cn('flex items-center', s.gap, className)}>
      <img
        src={akfMark}
        alt="Aga Khan Foundation logo"
        className={cn(s.mark, 'w-auto shrink-0 select-none')}
        draggable={false}
      />
      {showText && (
        <div
          className={cn(
            'flex flex-col justify-center border-l border-border-default dark:border-border-dark pl-3',
            textClassName
          )}
        >
          <span
            className={cn(
              'font-bold leading-tight tracking-tight text-text-main dark:text-white',
              s.title
            )}
          >
            ESMS System
          </span>
          {showSubtitle && (
            <span className="text-[11px] font-medium leading-tight text-text-secondary dark:text-gray-400">
              Aga Khan Foundation – Syria
            </span>
          )}
        </div>
      )}
    </div>
  )
}
