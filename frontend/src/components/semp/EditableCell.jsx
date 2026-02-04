/**
 * EditableCell Component
 * contenteditable cell
 */

import { useRef, useEffect } from 'react'
import { cn } from '@/utils/cn'

export default function EditableCell({
  value = '',
  onChange,
  placeholder = '',
  readOnly = false,
  multiline = false,
  className = '',
}) {
  const cellRef = useRef(null)

  // Sync content when value changes externally
  useEffect(() => {
    if (cellRef.current && cellRef.current.textContent !== value) {
      cellRef.current.textContent = value || ''
    }
  }, [value])

  const handleInput = (e) => {
    const newValue = e.currentTarget.textContent || ''
    onChange(newValue)
  }

  const handleKeyDown = (e) => {
    // Prevent Enter for single line
    if (!multiline && e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  return (
    <div
      ref={cellRef}
      contentEditable={!readOnly}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      suppressContentEditableWarning
      data-placeholder={placeholder}
      dir="ltr"
      className={cn(
        'excel-cell',
        'w-full h-full min-h-[40px] flex items-center justify-start text-left',
        'px-2 py-2 outline-none word-break-word whitespace-pre-wrap bg-transparent',
        'text-sm text-text-main dark:text-white',
        'focus:shadow-[inset_0_0_0_2px_#11d452] focus:bg-primary/5 focus:z-10 focus:relative',
        readOnly && 'cursor-default',
        'empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none',
        className
      )}
    >
      {/* Initial render only, subsequent updates via ref/effect */}
    </div>
  )
}
