import { cn } from '@/utils'
import { getScreeningCategory } from '@/utils/screeningDisplay'

/**
 * ScreeningCategoryBadge - شارة فئة الفرز (Tool 1)
 * متوافق مع backend/src/models/screening.model.js - حقل category_code
 *
 * @param {Object} props
 * @param {string} props.category - فئة الفرز (A, B, C, D, E, F فقط - من Backend)
 * @param {'sm'|'md'|'lg'} props.size - الحجم (default: 'md')
 * @param {boolean} props.showBorder - عرض الحدود (default: true)
 * @param {boolean} props.showLabel - عرض التسمية بجانب الرمز (default: false)
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
