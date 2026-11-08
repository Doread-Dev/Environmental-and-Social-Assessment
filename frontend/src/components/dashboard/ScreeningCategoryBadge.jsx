import { cn } from '@/utils'
import { getScreeningCategory } from '@/utils/screeningDisplay'

/**
 * ScreeningCategoryBadge - the screening category (Tool 1)
 * Matches backend/src/models/screening.model.js, field category_code
 *
 * @param {Object} props
 * @param {string} props.category - Screening category (A–F, from the backend)
 * @param {'sm'|'md'|'lg'} props.size - Size (default: 'md')
 * @param {boolean} props.showBorder - Show the border (default: true)
 * @param {boolean} props.showLabel - Show the label next to the code (default: false)
 *
 * @example
 * <ScreeningCategoryBadge category="A" />
 * <ScreeningCategoryBadge category="B" showLabel size="lg" />
 */
function ScreeningCategoryBadge({
  category,
  size = 'md',
  showBorder = true,
  showLabel = false,
  className,
  ...props
}) {
  const categoryInfo = getScreeningCategory(category)

  if (!categoryInfo) {
    return null
  }

  const sizes = {
    sm: {
      container: 'w-6 h-6 text-[10px]',
      label: 'text-[10px]',
    },
    md: {
      container: 'w-8 h-8 text-xs',
      label: 'text-xs',
    },
    lg: {
      container: 'w-10 h-10 text-sm',
      label: 'text-sm',
    },
  }

  const sizeConfig = sizes[size]

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)} {...props}>
      <div
        className={cn(
          'flex items-center justify-center',
          'rounded-full font-bold',
          categoryInfo.bgColor,
          categoryInfo.textColor,
          showBorder && categoryInfo.borderColor && `border-2 ${categoryInfo.borderColor}`,
          sizeConfig.container
        )}
        title={categoryInfo.description}
      >
        {category}
      </div>
      {showLabel && (
        <span className={cn('font-medium', categoryInfo.textColor, sizeConfig.label)}>
          {categoryInfo.label}
        </span>
      )}
    </div>
  )
}

export default ScreeningCategoryBadge
