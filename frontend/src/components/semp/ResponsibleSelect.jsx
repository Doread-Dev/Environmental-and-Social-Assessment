/**
 * ResponsibleSelect Component
 * محدد المسؤول (Select في خلية الجدول)
 */

import { cn } from '@/utils/cn'
import { mockUsers } from '@/data'

export default function ResponsibleSelect({ value, onChange, users = mockUsers, readOnly = false }) {
  const selectedUser = users.find(u => u._id === value)

  return (
    <div className="h-full flex items-center px-2 py-2">
      {readOnly ? (
        <span className="text-sm text-text-main dark:text-white">
          {selectedUser ? selectedUser.name : '-'}
        </span>
      ) : (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className={cn(
            'w-full bg-transparent border-none outline-none',
            'text-sm text-text-main dark:text-white',
            'focus:ring-0 cursor-pointer'
          )}
        >
          <option value="">Select...</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
