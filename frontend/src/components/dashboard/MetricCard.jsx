import { Icon } from '@/components/ui'
import { cn } from '@/utils'

/**
 * MetricCard - بطاقة عرض المقاييس الإحصائية
 *
 * @param {Object} props
 * @param {string} props.title - عنوان المقياس
 * @param {number|string} props.value - قيمة المقياس
 * @param {string} props.icon - اسم الأيقونة (Material Symbols)
 * @param {string} props.iconBgColor - لون خلفية الأيقونة (default: 'bg-blue-50')
 * @param {string} props.iconColor - لون الأيقونة (default: 'text-blue-600')
 * @param {string} props.badge - نص Badge (اختياري)
 * @param {string} props.badgeVariant - نوع Badge (default: 'warning')
 * @param {string} props.subtitle - نص فرعي (اختياري)
 * @param {boolean} props.highlight - هل البطاقة مميزة (للتنبيه)
 *
 * @example
 * <MetricCard
 *   title="Total Projects"
 *   value={42}
 *   icon="folder"
 * />
 * <MetricCard
 *   title="High Risk Projects"
 *   value={3}
 *   icon="warning"
 *   highlight
 *   badge="Attention"
 * />
 */
function MetricCard({
  title,
  value,
  icon,
  iconBgColor = 'bg-blue-50 dark:bg-blue-900/20',
  iconColor = 'text-blue-600 dark:text-blue-400',
  badge,
  badgeVariant = 'warning',
  subtitle,
  highlight = false,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        'bg-surface dark:bg-surface-dark',
        'p-5 rounded-xl',
        'border border-border-default dark:border-border-dark',
        'shadow-sm flex flex-col gap-4',
        highlight && 'border-red-100 dark:border-red-900/30 relative overflow-hidden',
        className
      )}
      {...props}
    >
      {/* Decorative shape for highlighted cards */}
      {highlight && (
        <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/5 rounded-bl-full -mr-4 -mt-4" />
      )}

      <div className="flex items-center justify-between relative z-10">
        <div className={cn('p-2 rounded-lg', iconBgColor)}>
          <Icon name={icon} className={cn('text-xl', iconColor)} />
        </div>
        {badge && (
          <span
            className={cn(
              'flex items-center text-xs font-medium px-2 py-0.5 rounded-full',
              badgeVariant === 'warning' &&
                'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
              badgeVariant === 'info' &&
                'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
            )}
          >
            {badge}
          </span>
        )}
        {subtitle && !badge && <span className="text-xs text-text-secondary">{subtitle}</span>}
      </div>

      <div className={cn('relative z-10')}>
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        <h3 className="text-3xl font-bold text-text-main dark:text-white mt-1">{value}</h3>
      </div>
    </div>
  )
}

export default MetricCard
