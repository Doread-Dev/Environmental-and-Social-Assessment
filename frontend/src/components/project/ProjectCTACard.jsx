/**
 * ProjectCTACard Component
 * Next-step card (call to action)
 *
 * Features:
 * - gradient background
 * - soft glow in the top right corner
 * - green button with shadow-lg shadow-primary/30
 */

import { cn } from '@/utils/cn'
import { Button } from '@/components/ui'

/**
 * @param {Object} props
 * @param {string} props.title - Action title
 * @param {string} props.description - Action description
 * @param {string} props.buttonText - Button text
 * @param {string} props.buttonIcon - Button icon
 * @param {Function} props.onClick - Called on click
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
        'bg-gradient-to-r from-white to-primary-soft dark:from-surface-dark dark:to-background-dark rounded-xl shadow-md border border-primary/20 p-6 flex items-center justify-between relative overflow-hidden group',
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
        <Button variant="primary" size="lg" onClick={onClick}>
          <span>{buttonText}</span>
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            {buttonIcon}
          </span>
        </Button>
      </div>
    </div>
  )
}

export default ProjectCTACard
