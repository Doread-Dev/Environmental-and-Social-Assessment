/**
 * EditableCell Component
 * contenteditable cell
 */

import { useRef, useEffect } from 'react'
import { cn } from '@/utils/cn'
import { MAX_TEXT_LENGTH } from '@/utils/textLimits'

// The cell's text, cut at the shared free-text limit (D74 4): a contenteditable has no maxLength
function cellText(cell) {
  const text = cell.textContent || ''
  if (text.length <= MAX_TEXT_LENGTH) return text
  const cut = text.slice(0, MAX_TEXT_LENGTH)
  cell.textContent = cut
  return cut
}

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

  const handleInput = (e) => onChange(cellText(e.currentTarget))

  // Pasted text goes in as plain text: the cell saves its text only, so pasted formatting,
  // links or images would show here but never be saved (phase 10a)
  const handlePaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData?.getData('text/plain') ?? ''
    const plain = multiline ? text : text.replace(/\s*\n\s*/g, ' ')
    if (!document.execCommand?.('insertText', false, plain)) {
      e.currentTarget.textContent = (e.currentTarget.textContent || '') + plain
    }
    onChange(cellText(e.currentTarget))
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
      onPaste={handlePaste}
      suppressContentEditableWarning
      data-placeholder={placeholder}
      dir="ltr"
      className={cn(
        'excel-cell',
        'w-full h-full min-h-[40px] flex items-center justify-start text-left',
        'px-2 py-2 outline-none word-break-word whitespace-pre-wrap bg-transparent',
        'text-sm text-text-main dark:text-white',
        'focus:ring-2 focus:ring-inset focus:ring-primary focus:bg-primary/5 focus:z-10 focus:relative',
        readOnly && 'cursor-default',
        'empty:before:content-[attr(data-placeholder)] empty:before:text-text-disabled empty:before:pointer-events-none',
        className
      )}
    >
      {/* Initial render only, subsequent updates via ref/effect */}
    </div>
  )
}
