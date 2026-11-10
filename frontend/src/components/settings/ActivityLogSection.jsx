/**
 * ActivityLogSection
 * The critical-actions log (D65), admin only: who deleted, archived or restored what, and every
 * user/access change. Newest first, filtered by action, paginated on the server. A row expands to
 * show what the record looked like (its snapshot).
 */

import { Fragment, useState } from 'react'
import { useAuditLogs, useLookups } from '@/hooks'
import { ROLE_LABELS } from '@/contexts'
import { Table, Badge, Pagination, Icon, Select, LoadingState, ErrorState } from '@/components/ui'
import { cn } from '@/utils/cn'
import {
  AUDIT_ACTION_FILTER_GROUPS,
  AUDIT_TARGET_LABELS,
  auditActionLabel,
  auditActionVariant,
  describeAuditEntry,
  formatAuditDate,
} from '@/utils/auditLabels'

const PAGE_SIZE = 20
const COLUMNS = 6

function EntryDetails({ entry }) {
  // Place labels for file categories and library links (GET /lookups, cached)
  const { placeLabel } = useLookups()
  const { fields, rows } = describeAuditEntry(entry, { placeLabel })
  if (fields.length === 0 && rows.length === 0) {
    return (
      <p className="text-sm text-text-secondary dark:text-gray-400">
        No further details are recorded for this action.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-4">
      {fields.length > 0 && (
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary dark:text-gray-400">
                {label}
              </dt>
              <dd className="mt-0.5 text-sm text-text-main dark:text-white break-words">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {rows.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary dark:text-gray-400 mb-2">
            Removed rows
          </p>
          <ul className="flex flex-col gap-1.5">
            {rows.map((row) => (
              <li key={row.key} className="flex gap-3 text-sm text-text-main dark:text-white">
                <span className="shrink-0 font-mono text-text-secondary dark:text-gray-400">
                  #{row.serial}
                </span>
                <span className="break-words">{row.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function ActivityLogSection() {
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState(() => new Set())
  const { entries, pagination, isLoading, isFetching, error, refetch } = useAuditLogs({
    page,
    limit: PAGE_SIZE,
    action,
  })

  const changeAction = (value) => {
    setAction(value)
    setPage(1)
    setExpanded(new Set())
  }

  const changePage = (next) => {
    setPage(next)
    setExpanded(new Set())
  }

  const toggle = (id) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const first = (pagination.page - 1) * pagination.limit + 1
  const last = Math.min(pagination.page * pagination.limit, pagination.total)

  return (
    <section className="bg-surface dark:bg-surface-dark rounded-xl shadow-sm border border-border-default dark:border-border-dark overflow-hidden">
      <div className="px-6 py-4 border-b border-border-default dark:border-border-dark">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-text-main dark:text-white">Activity log</h2>
            <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
              Deletions, archive and restore, and user or access changes, with who did them
            </p>
          </div>
          <Select
            value={action}
            onChange={(e) => changeAction(e.target.value)}
            aria-label="Action filter"
            placeholder="All actions"
            className="sm:w-72"
          >
            {AUDIT_ACTION_FILTER_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.all && <option value={group.all}>All — {group.label}</option>}
                {group.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <LoadingState message="Loading activity log..." variant="section" />
        ) : error ? (
          <ErrorState
            variant="section"
            title="Could not load the activity log"
            message={error}
            onRetry={refetch}
          />
        ) : (
          <>
            <div
              className={cn(
                'border border-border-default dark:border-border-dark rounded-lg overflow-hidden transition-opacity',
                isFetching && 'opacity-60'
              )}
            >
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.Head className="w-10">
                      <span className="sr-only">Details</span>
                    </Table.Head>
                    <Table.Head>Date</Table.Head>
                    <Table.Head>Who</Table.Head>
                    <Table.Head>Action</Table.Head>
                    <Table.Head>Project</Table.Head>
                    <Table.Head>Target</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {entries.length === 0 ? (
                    <Table.Empty
                      message={
                        action
                          ? 'No entries for this action'
                          : 'No critical actions have been recorded yet'
                      }
                    />
                  ) : (
                    entries.map((entry) => {
                      const open = expanded.has(entry._id)
                      return (
                        <Fragment key={entry._id}>
                          <Table.Row
                            isClickable
                            isSelected={open}
                            onClick={() => toggle(entry._id)}
                          >
                            <Table.Cell className="w-10 pr-0">
                              <button
                                type="button"
                                aria-expanded={open}
                                aria-label={open ? 'Hide details' : 'Show details'}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggle(entry._id)
                                }}
                                className="p-1 rounded-lg text-text-secondary dark:text-gray-400 hover:text-primary hover:bg-background dark:hover:bg-background-dark"
                              >
                                <Icon
                                  name={open ? 'expand_less' : 'expand_more'}
                                  className="text-lg"
                                />
                              </button>
                            </Table.Cell>
                            <Table.Cell className="whitespace-nowrap text-text-secondary dark:text-gray-400">
                              {formatAuditDate(entry.createdAt)}
                            </Table.Cell>
                            <Table.Cell>
                              <p className="font-medium text-text-main dark:text-white">
                                {entry.by_name}
                              </p>
                              <p className="text-xs text-text-secondary dark:text-gray-400">
                                {ROLE_LABELS[entry.by_role] ?? entry.by_role}
                              </p>
                            </Table.Cell>
                            <Table.Cell>
                              <Badge
                                variant={auditActionVariant(entry.action)}
                                className="whitespace-nowrap"
                              >
                                {auditActionLabel(entry.action)}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>
                              {entry.project_title ?? (
                                <span className="text-text-secondary dark:text-gray-400">—</span>
                              )}
                            </Table.Cell>
                            <Table.Cell>
                              <p className="text-text-main dark:text-white break-words">
                                {entry.target_label ?? '—'}
                              </p>
                              <p className="text-xs text-text-secondary dark:text-gray-400">
                                {AUDIT_TARGET_LABELS[entry.target_type] ?? entry.target_type}
                              </p>
                            </Table.Cell>
                          </Table.Row>
                          {open && (
                            <tr className="border-b border-border-default dark:border-border-dark bg-background dark:bg-background-dark">
                              <td colSpan={COLUMNS} className="px-6 py-4">
                                <EntryDetails entry={entry} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })
                  )}
                </Table.Body>
              </Table>
            </div>

            {pagination.total > 0 && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-text-secondary dark:text-gray-400">
                  Showing {first}–{last} of {pagination.total}
                </p>
                {pagination.pages > 1 && (
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.pages}
                    onPageChange={changePage}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default ActivityLogSection
