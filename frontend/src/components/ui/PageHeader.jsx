import { cn } from '@/utils/cn'

import { PAGE_DESCRIPTION, PAGE_TITLE } from './typography'

/**
 * The page header of the app (D71): one title size, one description style, actions on the
 * right (below the title on small screens).
 *
 * @param {Object} props
 * @param {React.ReactNode} props.title - The page's h1
 * @param {React.ReactNode} [props.description]
 * @param {React.ReactNode} [props.eyebrow] - Small line above the title (e.g. "Tool 3")
 * @param {React.ReactNode} [props.badges] - Status badges next to the title
 * @param {React.ReactNode} [props.actions] - Buttons on the right
 *
 * @example
 * <PageHeader title="Library" description="Guidance documents" actions={<Button>Upload</Button>} />
 */
function PageHeader({ title, description, eyebrow, badges, actions, className, children }) {
  return (
    <header
      className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}
    >
      <div className="flex flex-col gap-1 min-w-0">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wider text-primary dark:text-green-300">
            {eyebrow}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className={PAGE_TITLE}>{title}</h1>
          {badges}
        </div>
        {description && <p className={cn(PAGE_DESCRIPTION, 'max-w-3xl')}>{description}</p>}
        {children}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end shrink-0">{actions}</div>
      )}
    </header>
  )
}

export default PageHeader
