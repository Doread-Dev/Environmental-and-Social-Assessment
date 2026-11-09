import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Button,
  ErrorState,
  Icon,
  LoadingState,
  PageHeader,
  PAGE_TITLE,
  SECTION_TITLE,
} from '@/components/ui'
import { useAuth } from '@/contexts'
import { useHelp, useHelpLanguage } from '@/hooks/useHelp'
import { cn } from '@/utils/cn'

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
]

/** The element id of a guide part or section on this page */
const helpAnchor = (id) => `help-${id}`

/**
 * The Markdown of the guide as React elements, never as HTML (D78): raw HTML in the text is
 * dropped (skipHtml), and links only go to parts or sections of this page.
 */
function GuideMarkdown({ children, onOpen }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      skipHtml
      components={{
        h3: ({ children: text }) => (
          <h4 className="text-base font-semibold text-text-main dark:text-white mt-4">{text}</h4>
        ),
        p: ({ children: text }) => <p className="text-sm leading-relaxed">{text}</p>,
        ul: ({ children: items }) => (
          <ul className="list-disc ps-5 flex flex-col gap-1 text-sm">{items}</ul>
        ),
        ol: ({ children: items }) => (
          <ol className="list-decimal ps-5 flex flex-col gap-1 text-sm">{items}</ol>
        ),
        strong: ({ children: text }) => (
          <strong className="font-semibold text-text-main dark:text-white">
            <bdi>{text}</bdi>
          </strong>
        ),
        code: ({ children: text }) => (
          <code className="font-mono text-xs px-1 rounded bg-background dark:bg-background-dark">
            {text}
          </code>
        ),
        table: ({ children: rows }) => (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">{rows}</table>
          </div>
        ),
        th: ({ children: text }) => (
          <th className="text-start font-semibold p-2 border-b border-border-default dark:border-border-dark">
            {text}
          </th>
        ),
        td: ({ children: text }) => (
          <td className="align-top p-2 border-b border-border-default dark:border-border-dark">
            {text}
          </td>
        ),
        a: ({ href, children: text }) => {
          if (!href?.startsWith('#')) return <span>{text}</span>
          const id = href.slice(1)
          return (
            <a
              href={`#${helpAnchor(id)}`}
              onClick={(event) => {
                event.preventDefault()
                onOpen(id)
              }}
              className="text-primary dark:text-green-300 underline underline-offset-2"
            >
              {text}
            </a>
          )
        },
      }}
    >
      {children}
    </Markdown>
  )
}

function ContentsLink({ id, title, active, onOpen, className }) {
  return (
    <a
      href={`#${helpAnchor(id)}`}
      aria-current={active ? 'location' : undefined}
      onClick={(event) => {
        event.preventDefault()
        onOpen(id)
      }}
      className={cn(
        'block rounded-md px-2 py-1 -mx-2 hover:text-primary',
        active && 'bg-primary/10 text-primary dark:text-green-300 font-semibold',
        className
      )}
    >
      {title}
    </a>
  )
}

/**
 * The parts and sections, with the one being read highlighted (scroll-spy). In a long list the
 * highlighted item is kept in view by scrolling the list itself, never the page.
 */
function Contents({ parts, activeId, onOpen, containerRef }) {
  useEffect(() => {
    const container = containerRef.current
    const item = container?.querySelector('[aria-current="location"]')
    if (!item || container.scrollHeight <= container.clientHeight) return
    const box = container.getBoundingClientRect()
    const at = item.getBoundingClientRect()
    if (at.top < box.top || at.bottom > box.bottom) {
      container.scrollTop += at.top - box.top - container.clientHeight / 2
    }
  }, [activeId, containerRef])

  return (
    <nav aria-label="Contents" className="flex flex-col gap-3 text-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">Contents</p>
      <ol className="flex flex-col gap-2">
        {parts.map((part) => (
          <li key={part.id} className="flex flex-col gap-1">
            <ContentsLink
              id={part.id}
              title={part.title}
              active={activeId === part.id}
              onOpen={onOpen}
              className="font-semibold text-text-main dark:text-white"
            />
            {part.sections.length > 0 && (
              <ol className="flex flex-col gap-1 ps-3 border-s border-border-default dark:border-border-dark">
                {part.sections.map((section) => (
                  <li key={section.id}>
                    <ContentsLink
                      id={section.id}
                      title={section.title}
                      active={activeId === section.id}
                      onOpen={onOpen}
                      className="text-text-secondary dark:text-gray-400"
                    />
                  </li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/**
 * Scroll-spy: the id of the part or section being read, the last heading that has reached the band
 * at the top of the screen (the top 30 %). One IntersectionObserver watches the headings and
 * reports only when one crosses the band's edges, so scrolling itself causes no work; each report
 * looks at where the headings are, so a fast jump lands right too. Vertical only, so Arabic (RTL)
 * works the same.
 * @param {string[]} ids - The guide's part and section ids, in reading order
 */
function useScrollSpy(ids) {
  const [activeId, setActiveId] = useState(null)
  useEffect(() => {
    if (ids.length === 0 || typeof IntersectionObserver === 'undefined') return undefined
    const headings = ids
      .map((id) => document.getElementById(`${helpAnchor(id)}-title`))
      .filter(Boolean)
    const observer = new IntersectionObserver(
      (entries) => {
        const bandBottom = entries[0]?.rootBounds?.bottom ?? window.innerHeight * 0.3
        let current = headings[0]
        for (const heading of headings) {
          if (heading.getBoundingClientRect().top > bandBottom) break
          current = heading
        }
        if (current) setActiveId(current.dataset.helpId)
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0 }
    )
    headings.forEach((heading) => observer.observe(heading))
    return () => observer.disconnect()
  }, [ids])
  return [activeId, setActiveId]
}

/**
 * HelpPage - the in-app user guide (phase 14, D78)
 * Every role; the server sends only the parts and sections the user's permissions allow.
 * Route: /app/help, ?section=<id>[,<id>…] opens it at the first of these parts or sections the
 * user's guide has (the floating Help button, routes/helpSections.js), else at the start.
 */
function HelpPage() {
  const { user } = useAuth()
  const [lang, setLang] = useHelpLanguage(user?._id)
  const { guide, isLoading, error, retry } = useHelp(lang)
  const [searchParams, setSearchParams] = useSearchParams()
  const section = searchParams.get('section') ?? ''
  const topId = useId()
  const contentsRef = useRef(null)
  const ids = useMemo(
    () => guide?.parts.flatMap((part) => [part.id, ...part.sections.map((item) => item.id)]) ?? [],
    [guide]
  )
  const [activeId, setActiveId] = useScrollSpy(ids)

  useEffect(() => {
    if (!guide) return
    const target = section
      .split(',')
      .map((id) => document.getElementById(helpAnchor(id)))
      .find(Boolean)
    const element = target ?? document.getElementById(topId)
    element?.scrollIntoView?.({ block: 'start' })
    setActiveId(target ? target.id.slice(helpAnchor('').length) : (ids[0] ?? null))
  }, [guide, section, topId, ids, setActiveId])

  const open = (id) => setSearchParams({ section: id })

  const actions = (
    <div className="flex flex-wrap items-center gap-2" data-print="hide">
      <div role="group" aria-label="Guide language" className="flex gap-1">
        {LANGUAGE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            size="sm"
            variant={lang === option.value ? 'primary' : 'outline'}
            aria-pressed={lang === option.value}
            lang={option.value}
            onClick={() => setLang(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <Button
        size="sm"
        variant="secondary"
        leftIcon={<Icon name="print" />}
        onClick={() => window.print()}
      >
        Print
      </Button>
    </div>
  )

  return (
    <div className="flex flex-col gap-6" id={topId}>
      <PageHeader
        title="Help"
        description="The user guide for your role. Pages with a Help button open it at their own section."
        actions={actions}
      />

      {isLoading ? (
        <LoadingState message="Loading the guide..." variant="section" />
      ) : error ? (
        <ErrorState
          variant="section"
          title="Could not load the guide"
          message={error}
          onRetry={retry}
        />
      ) : (
        <div
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-8 items-start"
        >
          <aside
            ref={contentsRef}
            data-print="hide"
            className="lg:sticky lg:top-0 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto bg-surface dark:bg-surface-dark border border-border-default dark:border-border-dark rounded-xl p-4"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            lang={lang}
          >
            <Contents
              parts={guide.parts}
              activeId={activeId}
              onOpen={open}
              containerRef={contentsRef}
            />
          </aside>

          <article
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            lang={lang}
            aria-label="User guide"
            className="flex flex-col gap-10 text-text-secondary dark:text-gray-300 min-w-0"
          >
            {guide.parts.map((part) => (
              <section
                key={part.id}
                id={helpAnchor(part.id)}
                aria-labelledby={`${helpAnchor(part.id)}-title`}
                className="flex flex-col gap-4 scroll-mt-4 bg-surface dark:bg-surface-dark border border-border-default dark:border-border-dark rounded-xl p-6 print:border-0 print:p-0"
              >
                <h2
                  id={`${helpAnchor(part.id)}-title`}
                  data-help-id={part.id}
                  className={cn(PAGE_TITLE, 'text-xl md:text-2xl')}
                >
                  {part.title}
                </h2>
                {part.intro && <GuideMarkdown onOpen={open}>{part.intro}</GuideMarkdown>}
                {part.sections.map((item) => (
                  <section
                    key={item.id}
                    id={helpAnchor(item.id)}
                    aria-labelledby={`${helpAnchor(item.id)}-title`}
                    className="flex flex-col gap-3 scroll-mt-4"
                  >
                    <h3
                      id={`${helpAnchor(item.id)}-title`}
                      data-help-id={item.id}
                      className={SECTION_TITLE}
                    >
                      {item.title}
                    </h3>
                    <GuideMarkdown onOpen={open}>{item.body}</GuideMarkdown>
                  </section>
                ))}
              </section>
            ))}
          </article>
        </div>
      )}
    </div>
  )
}

export default HelpPage
