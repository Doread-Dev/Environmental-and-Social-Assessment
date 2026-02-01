/**
 * TableRowActions Component
 * زر حذف الصف العائم
 */

import { cn } from '@/utils/cn'

export default function TableRowActions({ onDelete, isVisible, position = {} }) {
  if (!isVisible) return null

  return (
    <button
      onClick={onDelete}
      className={cn(
        'absolute -right-10 top-1/2 -translate-y-1/2',
        'size-8 rounded-lg bg-red-500 hover:bg-red-600 text-white',
        'flex items-center justify-center shadow-lg',
        'transition-all opacity-0 group-hover:opacity-100',
        'z-20'
      )}
      title="Delete row"
      style={position}
    >
      <span className="material-symbols-outlined text-lg">delete</span>
    </button>
  )
}
