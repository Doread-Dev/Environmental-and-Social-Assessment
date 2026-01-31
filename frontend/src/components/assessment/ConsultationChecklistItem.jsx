/**
 * ConsultationChecklistItem Component
 * عنصر قائمة تحقق للاستشارات المجتمعية (CommunityConsultation)
 */

import { cn } from '@/utils/cn'
import { Checkbox, Input, Textarea } from '@/components/ui'

/**
 * @param {Object} props
 * @param {Object} props.consultation - بيانات نوع الاستشارة
 * @param {boolean} props.checked - هل محدد
 * @param {string} props.participants - المشاركون (من communityConsultation.model)
 * @param {Function} props.onCheckedChange - callback للتحديد
 * @param {Function} props.onParticipantsChange - callback للمشاركين
 * @param {boolean} props.readOnly - وضع القراءة فقط
 */
export default function ConsultationChecklistItem({
  consultation,
  checked = false,
  participants = '',
  onCheckedChange,
  onParticipantsChange,
  readOnly = false
}) {
  const InputComponent = consultation.inputType === 'textarea' ? Textarea : Input

  return (
    <div className="checkbox-wrapper flex flex-col gap-3 p-3 rounded-lg hover:bg-gray-50/50 dark:hover:bg-white/5">
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
          <p className="text-text-main dark:text-gray-200 font-medium">{consultation.label}</p>
          {consultation.description && (
            <p className="text-sm text-text-secondary mt-0.5">{consultation.description}</p>
          )}
        </div>
      </label>
      <div
        className={cn(
          'input-container pl-9 pr-2 transition-all',
          checked ? 'block' : 'hidden'
        )}
      >
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
            {consultation.id === 'village_meetings'
              ? 'Who attended, How many, Where?'
              : consultation.id === 'community_interviews'
              ? 'Who was interviewed?'
              : consultation.id === 'committee_consultation'
              ? 'Committee details'
              : 'Details'}
          </label>
          <InputComponent
            value={participants}
            onChange={(e) => onParticipantsChange?.(e.target.value)}
            placeholder={consultation.placeholder}
            rows={consultation.rows || 2}
            disabled={readOnly || !checked}
            className="text-sm"
          />
        </div>
      </div>
    </div>
  )
}
