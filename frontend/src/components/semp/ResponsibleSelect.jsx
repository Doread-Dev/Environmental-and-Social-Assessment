/**
 * ResponsibleSelect Component
 * "Responsible" on Tools 3, 4 and 5 (D55): an internal user (picker) or an external party
 * (free text), never both. The switch picks the mode; switching clears the other value.
 */

import { useState } from 'react'
import { cn } from '@/utils/cn'

const MODES = [
  { key: 'user', label: 'Internal user', icon: 'person' },
  { key: 'external', label: 'External party', icon: 'apartment' },
]

const idOf = (value) => (typeof value === 'object' && value !== null ? value._id : value)

/**
 * @param {Object} props
 * @param {Object|string|null} props.value - Responsible user (populated or id)
 * @param {string} [props.valueText] - External party (responsible_text)
 * @param {Function} props.onChange - ({ responsible, responsible_text }) => void
 * @param {Array} [props.users] - Users the picker offers (the active ones, D4)
 * @param {boolean} [props.readOnly]
 */
export default function ResponsibleSelect({
  value,
  valueText = '',
  onChange,
  users = [],
  readOnly = false,
  className,
}) {
  const responsibleId = idOf(value) || null
  const text = valueText ?? ''
  // The saved values decide the mode; an empty row keeps the mode the user picked
  // (a saved external party opens in external mode, and stays there while its text is erased)
  const [pickedMode, setPickedMode] = useState(() => (text && !responsibleId ? 'external' : 'user'))
  const mode = responsibleId ? 'user' : text ? 'external' : pickedMode

  const listedUser = users.find((u) => u._id === responsibleId)
  // The pickers list active users only (D4); a row keeps the name of a since-deactivated user
  // (the populated value carries is_active)
  const unlistedUser =
    !listedUser && typeof value === 'object' && value?.name
      ? { ...value, name: value.is_active === false ? `${value.name} (inactive)` : value.name }
      : null
  const selectedUser = listedUser || unlistedUser

  if (readOnly) {
    const shown = selectedUser?.name || text || '—'
    return (
      <div className={cn('h-full flex items-center', className)}>
        <span
          className="flex items-center gap-1.5 text-sm text-text-main dark:text-white px-2 py-1 w-full cursor-default"
          title={mode === 'external' && text ? `External party: ${text}` : shown}
          dir="auto"
        >
          {mode === 'external' && text && (
            <span
              className="material-symbols-outlined text-[16px] text-text-secondary dark:text-gray-400"
              aria-label="External party"
            >
              apartment
            </span>
          )}
          {shown}
        </span>
      </div>
    )
  }

  const switchTo = (next) => {
    if (next === mode) return
    setPickedMode(next)
    // Never both: the other value is cleared
    onChange({ responsible: null, responsible_text: '' })
  }

  return (
    <div className={cn('flex flex-col gap-1 w-full p-1', className)}>
      <div
        role="group"
        aria-label="Responsible type"
        className="inline-flex self-start rounded-md border border-border-default dark:border-border-dark overflow-hidden"
      >
        {MODES.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={mode === option.key}
            title={option.label}
            onClick={() => switchTo(option.key)}
            className={cn(
              'flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              mode === option.key
                ? 'bg-primary/10 text-primary dark:bg-primary/20'
                : 'text-text-secondary dark:text-gray-400 hover:bg-primary/5'
            )}
          >
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
              {option.icon}
            </span>
            {option.key === 'user' ? 'User' : 'External'}
          </button>
        ))}
      </div>

      {mode === 'user' ? (
        <div className="relative w-full group">
          <select
            aria-label="Responsible user"
            value={responsibleId || ''}
            onChange={(e) =>
              onChange({ responsible: e.target.value || null, responsible_text: '' })
            }
            className={cn(
              'w-full px-2 py-1 pr-7 rounded',
              'bg-transparent border border-transparent',
              'text-sm text-text-main dark:text-white',
              'appearance-none cursor-pointer transition-colors',
              'hover:bg-primary/5',
              'focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50',
              'focus:bg-surface dark:focus:bg-surface-dark'
            )}
          >
            <option value="">Select...</option>
            {unlistedUser && (
              <option value={unlistedUser._id} disabled>
                {unlistedUser.name}
              </option>
            )}
            {users.map((user) => (
              <option
                key={user._id}
                value={user._id}
                className="bg-surface dark:bg-surface-dark text-text-main dark:text-white"
              >
                {user.name}
              </option>
            ))}
          </select>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary dark:text-gray-400 opacity-60 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-lg">expand_more</span>
          </span>
        </div>
      ) : (
        <input
          type="text"
          aria-label="External party"
          dir="auto"
          value={text}
          onChange={(e) => onChange({ responsible: null, responsible_text: e.target.value })}
          placeholder="e.g. Contractor, Municipality"
          className={cn(
            'w-full min-w-0 px-2 py-1 text-sm rounded',
            'bg-transparent text-text-main dark:text-white',
            'border border-border-default dark:border-border-dark',
            'placeholder:text-text-secondary/60 dark:placeholder:text-gray-500',
            'focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50'
          )}
        />
      )}
    </div>
  )
}
