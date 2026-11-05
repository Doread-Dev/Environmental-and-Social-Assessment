/**
 * Type scale of the app (D71). One font family (Inter, `font-sans`), these sizes:
 * - page title (h1): PAGE_TITLE — PageHeader uses it; the few custom headers use it too
 * - page description: PAGE_DESCRIPTION
 * - section / card title (h2/h3): SECTION_TITLE (cards: `Card.Title`)
 * - body: text-sm; small print and labels: text-xs
 */
export const PAGE_TITLE =
  'text-2xl md:text-3xl font-bold tracking-tight text-text-main dark:text-white break-words'

export const PAGE_DESCRIPTION = 'text-sm md:text-base text-text-secondary dark:text-gray-400'

export const SECTION_TITLE = 'text-lg font-bold text-text-main dark:text-white'
