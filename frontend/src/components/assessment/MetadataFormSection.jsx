/**
 * MetadataFormSection Component
 * قسم نماذج البيانات الوصفية
 */

import { cn } from '@/utils/cn'
import { Textarea } from '@/components/ui'

/**
 * @param {Object} props
 * @param {Object} props.formData - بيانات النموذج
 * @param {Function} props.onChange - callback عند التغيير
 * @param {Object} props.errors - رسائل الخطأ
 * @param {boolean} props.readOnly - وضع القراءة فقط
 */
export default function MetadataFormSection({
  formData = {},
  onChange,
  errors = {},
  readOnly = false,
  className,
  ...props
}) {
  const handleChange = (field, value) => {
    onChange?.({ ...formData, [field]: value })
  }

  return (
    <form className={cn('p-6 md:p-8 flex flex-col gap-8', className)} {...props}>
      {/* Project Activity */}
      <div className="flex flex-col gap-2">
        <label className="text-text-main dark:text-white text-sm font-semibold">
          The project (Activity) component being assessed <span className="text-red-500">*</span>
        </label>
        <Textarea
          value={formData.project_activity || ''}
          onChange={(e) => handleChange('project_activity', e.target.value)}
          placeholder="Describe here..."
          rows={5}
          error={errors.project_activity}
          disabled={readOnly}
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <label className="text-text-main dark:text-white text-sm font-semibold">
          Brief description of the project (activities) being carried out <span className="text-red-500">*</span>
        </label>
        <p className="text-text-secondary text-xs mb-1">
          Detail the operational activities, construction phases, and expected outputs.
        </p>
        <Textarea
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe the activities here..."
          rows={5}
          error={errors.description}
          disabled={readOnly}
        />
      </div>

      {/* Environmental Setting */}
      <div className="flex flex-col gap-2">
        <label className="text-text-main dark:text-white text-sm font-semibold">
          Briefly describe the environmental setting of the project (activities) <span className="text-red-500">*</span>
        </label>
        <p className="text-text-secondary text-xs mb-1">
          Include physical, biological, and socio-economic characteristics of the site.
        </p>
        <Textarea
          value={formData.environmental_setting || ''}
          onChange={(e) => handleChange('environmental_setting', e.target.value)}
          placeholder="Describe the environment here..."
          rows={5}
          error={errors.environmental_setting}
          disabled={readOnly}
        />
      </div>

      {/* Legal Requirements */}
      <div className="flex flex-col gap-2">
        <label className="text-text-main dark:text-white text-sm font-semibold">
          The host country's legal requirements related to the environment or natural resources that
          apply to the project and how they will be met <span className="text-red-500">*</span>
        </label>
        <p className="text-text-secondary text-xs mb-1">
          List relevant laws and how compliance will be achieved.
        </p>
        <Textarea
          value={formData.legal_requirements || ''}
          onChange={(e) => handleChange('legal_requirements', e.target.value)}
          placeholder="List legal requirements and compliance strategies..."
          rows={5}
          error={errors.legal_requirements}
          disabled={readOnly}
        />
      </div>
    </form>
  )
}
