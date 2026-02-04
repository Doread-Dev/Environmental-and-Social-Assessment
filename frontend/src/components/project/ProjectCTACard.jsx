/**
 * ProjectCTACard Component
 * بطاقة الدعوة للإجراء (Next Step CTA)
 * مطابق للتصميم الأصلي حرفياً
 *
 * Features:
 * - خلفية متدرجة (gradient)
 * - تأثير ضبابي في الزاوية اليمنى العلوية
 * - زر أخضر مع shadow-lg shadow-primary/30
 */

import { cn } from '@/utils/cn'

/**
 * @param {Object} props
 * @param {string} props.title - عنوان الإجراء
 * @param {string} props.description - وصف الإجراء
 * @param {string} props.buttonText - نص الزر
 * @param {string} props.buttonIcon - أيقونة الزر
 * @param {Function} props.onClick - callback عند النقر
 */
function ProjectCTACard({
  title,
  description,
  buttonText,
  buttonIcon = 'arrow_forward',
  onClick,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        'bg-gradient-to-r from-white to-[#f0fdf4] dark:from-surface-dark dark:to-[#0f2e1b] rounded-xl shadow-md border border-primary/20 p-6 flex items-center justify-between relative overflow-hidden group',
        className
      )}
      {...props}
    >
      {/* Blur effect in top-right corner */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-2 max-w-lg">
        <h2 className="text-xl font-bold text-text-main dark:text-white">{title}</h2>
        <p className="text-text-secondary dark:text-gray-300 text-sm">{description}</p>
      </div>

      {/* Button */}
      <div className="relative z-10">
        <button
          onClick={onClick}
          className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-primary/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
        >
          <span>{buttonText}</span>
          <span className="material-symbols-outlined text-[20px]">{buttonIcon}</span>
        </button>
      </div>
    </div>
  )
}

export default ProjectCTACard
