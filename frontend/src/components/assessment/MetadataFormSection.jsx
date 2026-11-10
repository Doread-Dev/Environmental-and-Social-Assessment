/**
 * MetadataFormSection Component
 * The four free-text questions of the assessment metadata (Tool 2). Each text area is labelled by
 * its visible question, and its hint (when there is one) describes it.
 */

import { useId } from 'react'
import { cn } from '@/utils/cn'
import { Textarea } from '@/components/ui'

const FIELDS = [
  {
    name: 'project_activity',
    question: 'The project (Activity) component being assessed',
    placeholder: 'Describe here...',
  },
  {
    name: 'description',
    question: 'Brief description of the project (activities) being carried out',
    hint: 'Detail the operational activities, construction phases, and expected outputs.',
    placeholder: 'Describe the activities here...',
  },
  {
    name: 'environmental_setting',
    question: 'Briefly describe the environmental setting of the project (activities)',
    hint: 'Include physical, biological, and socio-economic characteristics of the site.',
    placeholder: 'Describe the environment here...',
  },
  {
    name: 'legal_requirements',
    question:
      "The host country's legal requirements related to the environment or natural resources that apply to the project and how they will be met",
    hint: 'List relevant laws and how compliance will be achieved.',
    placeholder: 'List legal requirements and compliance strategies...',
  },
]

/**
 * @param {Object} props
 * @param {Object} props.formData - the four field values
 * @param {Function} props.onChange - called with the whole form after a change
 * @param {Object} props.errors - error message per field
 * @param {boolean} props.readOnly - read-only mode
 */
export default function MetadataFormSection({
  formData = {},
  onChange,
  errors = {},
  readOnly = false,
  className,
  ...props
}) {
  const baseId = useId()
  const handleChange = (field, value) => {
    onChange?.({ ...formData, [field]: value })
  }

  return (
    <form className={cn('p-6 md:p-8 flex flex-col gap-8', className)} {...props}>
      {FIELDS.map(({ name, question, hint, placeholder }) => {
        const id = `${baseId}-${name}`
        return (
          <div key={name} className="flex flex-col gap-2">
            <label htmlFor={id} className="text-text-main dark:text-white text-sm font-semibold">
              {question} <span className="text-red-500">*</span>
            </label>
            {hint && (
              <p id={`${id}-hint`} className="text-text-secondary text-xs mb-1">
                {hint}
              </p>
            )}
            <Textarea
              id={id}
              aria-describedby={errors[name] ? `${id}-error` : hint ? `${id}-hint` : undefined}
              value={formData[name] || ''}
              onChange={(e) => handleChange(name, e.target.value)}
              placeholder={placeholder}
              rows={5}
              error={errors[name]}
              disabled={readOnly}
            />
          </div>
        )
      })}
    </form>
  )
}
