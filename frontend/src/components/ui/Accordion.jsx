import { useState, createContext, useContext } from 'react'
import { cn } from '@/utils/cn'

const AccordionContext = createContext(null)

/**
 * Accordion component for collapsible sections
 *
 * @param {Object} props
 * @param {string|string[]} props.defaultOpen - Initially open item(s)
 * @param {boolean} props.allowMultiple - Allow multiple items open
 * @param {Function} props.onChange - Change handler
 *
 * @example
 * <Accordion defaultOpen="item-1">
 *   <Accordion.Item value="item-1">
 *     <Accordion.Trigger>Section 1</Accordion.Trigger>
 *     <Accordion.Content>Content 1...</Accordion.Content>
 *   </Accordion.Item>
 *   <Accordion.Item value="item-2">
 *     <Accordion.Trigger>Section 2</Accordion.Trigger>
 *     <Accordion.Content>Content 2...</Accordion.Content>
 *   </Accordion.Item>
 * </Accordion>
 */
function Accordion({
  defaultOpen = [],
  allowMultiple = false,
  onChange,
  className,
  children,
  ...props
}) {
  const [openItems, setOpenItems] = useState(() => {
    if (Array.isArray(defaultOpen)) return defaultOpen
    return defaultOpen ? [defaultOpen] : []
  })

  const toggleItem = (value) => {
    setOpenItems((prev) => {
      let newItems
      if (prev.includes(value)) {
        newItems = prev.filter((item) => item !== value)
      } else {
        newItems = allowMultiple ? [...prev, value] : [value]
      }
      onChange?.(newItems)
      return newItems
    })
  }

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div
        className={cn('divide-y divide-border-default dark:divide-border-dark', className)}
        {...props}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

const AccordionItemContext = createContext(null)

function AccordionItem({ value, disabled = false, className, children, ...props }) {
  const { openItems } = useContext(AccordionContext)
  const isOpen = openItems.includes(value)

  return (
    <AccordionItemContext.Provider value={{ value, isOpen, disabled }}>
      <div
        className={cn(disabled && 'opacity-50', className)}
        data-state={isOpen ? 'open' : 'closed'}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  )
}

function AccordionTrigger({ className, children, ...props }) {
  const { toggleItem } = useContext(AccordionContext)
  const { value, isOpen, disabled } = useContext(AccordionItemContext)

  return (
    <button
      type="button"
      onClick={() => !disabled && toggleItem(value)}
      disabled={disabled}
      className={cn(
        'flex items-center justify-between w-full py-4 px-1',
        'text-left font-medium',
        'text-text-main dark:text-white',
        'hover:text-primary dark:hover:text-primary',
        'transition-colors',
        disabled && 'cursor-not-allowed',
        className
      )}
      aria-expanded={isOpen}
      {...props}
    >
      {children}
      <span
        className={cn(
          'material-symbols-outlined text-xl text-text-muted',
          'transition-transform duration-200',
          isOpen && 'rotate-180'
        )}
      >
        expand_more
      </span>
    </button>
  )
}

function AccordionContent({ className, children, ...props }) {
  const { isOpen } = useContext(AccordionItemContext)

  return (
    <div
      className={cn(
        'overflow-hidden transition-all duration-200',
        isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
      )}
      role="region"
      {...props}
    >
      <div className={cn('pb-4 px-1 text-text-secondary dark:text-gray-400', className)}>
        {children}
      </div>
    </div>
  )
}

Accordion.Item = AccordionItem
Accordion.Trigger = AccordionTrigger
Accordion.Content = AccordionContent

export default Accordion
