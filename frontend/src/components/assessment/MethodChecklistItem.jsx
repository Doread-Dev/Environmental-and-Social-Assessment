/**
 * MethodChecklistItem Component
 * Checklist item for one assessment method (AssessmentMethod)
 */

import { cn } from '@/utils/cn'
import { Checkbox, Input, Textarea } from '@/components/ui'

/**
 * @param {Object} props
 * @param {Object} props.method - The method
 * @param {boolean} props.checked - Whether it is selected
 * @param {string} props.details - Details (method_type + details)
 * @param {Function} props.onCheckedChange - Called when selected or cleared
 * @param {Function} props.onDetailsChange - Called when the details change
 * @param {boolean} props.readOnly - Read-only mode
 */
export default function MethodChecklistItem({
  method,
  checked = false,
  details = '',
  onCheckedChange,
  onDetailsChange,
  readOnly = false,
}) {
  const InputComponent = method.inputType === 'textarea' ? Textarea : Input

  return (
    <div className="checkbox-wrapper flex flex-col gap-3 p-3 rounded-lg hover:bg-background dark:hover:bg-white/5">
      <label className="flex flex-start gap-4 cursor-pointer">
        <div className="flex items-center h-6">
          <Checkbox
            checked={checked}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            disabled={readOnly}
            className="h-5 w-5"
          />
        </div>
        <div className="flex-1">
          <p className="text-text-main dark:text-gray-200 font-medium">{method.label}</p>
          {method.description && (
            <p className="text-sm text-text-secondary mt-0.5">{method.description}</p>
          )}
        </div>
      </label>
      <div className={cn('input-container pl-9 pr-2 transition-all', checked ? 'block' : 'hidden')}>
        <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
          {method.inputType === 'textarea'
            ? `Details of ${method.label.toLowerCase()}`
            : method.label}
        </label>
        <InputComponent
          value={details}
          onChange={(e) => onDetailsChange?.(e.target.value)}
          placeholder={method.placeholder}
          rows={method.rows || 2}
          disabled={readOnly || !checked}
          className="text-sm"
        />
      </div>
    </div>
  )
}
