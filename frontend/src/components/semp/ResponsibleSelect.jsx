/**
 * ResponsibleSelect Component
 * محدد المسؤول (Select في خلية الجدول)
 */

import { cn } from '@/utils/cn'

export default function ResponsibleSelect({
  value,
  onChange,
  users = [],
  readOnly = false,
  className,
}) {
  // Handle both object (populated from API) and string ID
  const responsibleId = typeof value === 'object' && value !== null ? value._id : value
  const selectedUser = users.find((u) => u._id === responsibleId)

  return (
    <div className={cn('h-full flex items-center relative', className)}>
      {readOnly ? (
        <span
          className={cn(
            'text-sm text-text-main dark:text-white px-2 py-1 rounded block w-full',
            'bg-gray-50 dark:bg-white/5 border border-transparent',
            'cursor-default select-none'
          )}
          title={selectedUser ? selectedUser.name : undefined}
        >
          {selectedUser ? selectedUser.name : '—'}
        </span>
      ) : (
        <div className="relative w-full h-full group">
          <select
            value={responsibleId || ''}
            onChange={(e) => onChange(e.target.value || null)}
            className={cn(
              'w-full h-full px-2 py-1 pr-7',
              'bg-transparent dark:bg-transparent',
              'border border-transparent rounded',
              'text-sm text-text-main dark:text-white',
              'appearance-none cursor-pointer',
              'transition-all duration-150',
              'hover:bg-gray-50/50 dark:hover:bg-white/5',
              'focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50',
              'focus:bg-white dark:focus:bg-surface-dark'
            )}
          >
            <option value="" className="text-text-secondary dark:text-gray-400">
              Select...
            </option>
            {users.map((user) => (
              <option
                key={user._id}
                value={user._id}
                className="bg-white dark:bg-surface-dark text-text-main dark:text-white"
              >
                {user.name}
              </option>
            ))}
          </select>
          {/* Dropdown arrow icon */}
          <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted dark:text-gray-500 opacity-60 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-lg">expand_more</span>
          </span>
        </div>
      )}
    </div>
  )
}
