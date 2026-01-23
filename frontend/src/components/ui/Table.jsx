import { cn } from '@/utils/cn'

/**
 * Table component with compound pattern
 *
 * @example
 * <Table>
 *   <Table.Header>
 *     <Table.Row>
 *       <Table.Head>Name</Table.Head>
 *       <Table.Head>Status</Table.Head>
 *     </Table.Row>
 *   </Table.Header>
 *   <Table.Body>
 *     <Table.Row>
 *       <Table.Cell>Project A</Table.Cell>
 *       <Table.Cell><Badge>Active</Badge></Table.Cell>
 *     </Table.Row>
 *   </Table.Body>
 * </Table>
 */
function Table({ className, children, ...props }) {
  return (
    <div className={cn('w-full overflow-auto', className)}>
      <table className="w-full caption-bottom text-sm" {...props}>
        {children}
      </table>
    </div>
  )
}

function TableHeader({ className, children, ...props }) {
  return (
    <thead className={cn('[&_tr]:border-b', className)} {...props}>
      {children}
    </thead>
  )
}

function TableBody({ className, children, ...props }) {
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props}>
      {children}
    </tbody>
  )
}

function TableFooter({ className, children, ...props }) {
  return (
    <tfoot
      className={cn(
        'border-t bg-background/50 dark:bg-background-dark/50 font-medium',
        className
      )}
      {...props}
    >
      {children}
    </tfoot>
  )
}

function TableRow({ className, children, isSelected, isClickable, ...props }) {
  return (
    <tr
      className={cn(
        'border-b border-border-default dark:border-border-dark',
        'transition-colors',
        'hover:bg-background/50 dark:hover:bg-surface-dark/50',
        isSelected && 'bg-primary/5 dark:bg-primary/10',
        isClickable && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  )
}

function TableHead({ className, children, sortable, sortDirection, onSort, ...props }) {
  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle font-semibold',
        'text-text-main dark:text-white',
        'bg-background dark:bg-background-dark',
        sortable && 'cursor-pointer select-none hover:bg-background dark:hover:bg-surface-dark',
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && (
          <span className="material-symbols-outlined text-base text-text-muted">
            {sortDirection === 'asc'
              ? 'arrow_upward'
              : sortDirection === 'desc'
                ? 'arrow_downward'
                : 'unfold_more'}
          </span>
        )}
      </div>
    </th>
  )
}

function TableCell({ className, children, ...props }) {
  return (
    <td
      className={cn('p-4 align-middle', 'text-text-main dark:text-gray-200', className)}
      {...props}
    >
      {children}
    </td>
  )
}

function TableCaption({ className, children, ...props }) {
  return (
    <caption
      className={cn('mt-4 text-sm text-text-secondary dark:text-gray-400', className)}
      {...props}
    >
      {children}
    </caption>
  )
}

// Empty state
function TableEmpty({ message = 'No data available', className, ...props }) {
  return (
    <tr>
      <td colSpan="100%" className={cn('py-12 text-center', className)} {...props}>
        <div className="flex flex-col items-center gap-2 text-text-muted dark:text-gray-500">
          <span className="material-symbols-outlined text-4xl">inbox</span>
          <p>{message}</p>
        </div>
      </td>
    </tr>
  )
}

Table.Header = TableHeader
Table.Body = TableBody
Table.Footer = TableFooter
Table.Row = TableRow
Table.Head = TableHead
Table.Cell = TableCell
Table.Caption = TableCaption
Table.Empty = TableEmpty

export default Table
