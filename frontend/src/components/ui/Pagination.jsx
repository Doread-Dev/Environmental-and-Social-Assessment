import { cn } from '@/utils/cn'

/**
 * Pagination component
 *
 * @param {Object} props
 * @param {number} props.currentPage - Current page (1-based)
 * @param {number} props.totalPages - Total number of pages
 * @param {Function} props.onPageChange - Page change handler
 * @param {number} props.siblingCount - Pages to show on each side of current
 * @param {boolean} props.showFirstLast - Show first/last page buttons
 *
 * @example
 * <Pagination currentPage={5} totalPages={20} onPageChange={setPage} />
 */
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  className,
  ...props
}) {
  const range = (start, end) => {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const getPageNumbers = () => {
    const totalPageNumbers = siblingCount * 2 + 5 // siblings + first + last + current + 2 dots

    if (totalPageNumbers >= totalPages) {
      return range(1, totalPages)
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)

    const shouldShowLeftDots = leftSiblingIndex > 2
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount
      const leftRange = range(1, leftItemCount)
      return [...leftRange, '...', totalPages]
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount
      const rightRange = range(totalPages - rightItemCount + 1, totalPages)
      return [1, '...', ...rightRange]
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex)
      return [1, '...', ...middleRange, '...', totalPages]
    }

    return range(1, totalPages)
  }

  const pages = getPageNumbers()

  const buttonClasses = cn(
    'flex items-center justify-center',
    'w-9 h-9 rounded-lg',
    'text-sm font-medium',
    'transition-colors duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  )

  return (
    <nav className={cn('flex items-center gap-1', className)} aria-label="Pagination" {...props}>
      {/* First page */}
      {showFirstLast && (
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={cn(
            buttonClasses,
            'text-text-secondary dark:text-gray-400',
            'hover:bg-background dark:hover:bg-surface-dark'
          )}
          aria-label="First page"
        >
          <span className="material-symbols-outlined text-lg">first_page</span>
        </button>
      )}

      {/* Previous */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          buttonClasses,
          'text-text-secondary dark:text-gray-400',
          'hover:bg-background dark:hover:bg-surface-dark'
        )}
        aria-label="Previous page"
      >
        <span className="material-symbols-outlined text-lg">chevron_left</span>
      </button>

      {/* Page numbers */}
      {pages.map((page, index) =>
        page === '...' ? (
          <span
            key={`dots-${index}`}
            className="w-9 h-9 flex items-center justify-center text-text-muted"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={cn(
              buttonClasses,
              page === currentPage
                ? 'bg-primary text-white'
                : 'text-text-main dark:text-white hover:bg-background dark:hover:bg-surface-dark'
            )}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          buttonClasses,
          'text-text-secondary dark:text-gray-400',
          'hover:bg-background dark:hover:bg-surface-dark'
        )}
        aria-label="Next page"
      >
        <span className="material-symbols-outlined text-lg">chevron_right</span>
      </button>

      {/* Last page */}
      {showFirstLast && (
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={cn(
            buttonClasses,
            'text-text-secondary dark:text-gray-400',
            'hover:bg-background dark:hover:bg-surface-dark'
          )}
          aria-label="Last page"
        >
          <span className="material-symbols-outlined text-lg">last_page</span>
        </button>
      )}
    </nav>
  )
}

export default Pagination
