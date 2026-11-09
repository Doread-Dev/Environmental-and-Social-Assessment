import { useEffect, useId } from 'react'
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

function Contents({ parts, onOpen }) {
  return (
    <nav aria-label="Contents" className="flex flex-col gap-3 text-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">Contents</p>
      <ol className="flex flex-col gap-2">
        {parts.map((part) => (
          <li key={part.id} className="flex flex-col gap-1">
            <a
              href={`#${helpAnchor(part.id)}`}
              onClick={(event) => {
                event.preventDefault()
                onOpen(part.id)
              }}
              className="font-semibold text-text-main dark:text-white hover:text-primary"
            >
              {part.title}
            </a>
            {part.sections.length > 0 && (
              <ol className="flex flex-col gap-1 ps-3 border-s border-border-default dark:border-border-dark">
                {part.sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${helpAnchor(section.id)}`}
                      onClick={(event) => {
                        event.preventDefault()
                        onOpen(section.id)
                      }}
                      className="text-text-secondary dark:text-gray-400 hover:text-primary"
                    >
                      {section.title}
                    </a>
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
 * HelpPage - the in-app user guide (phase 14, D78)
 * Every role; the server sends only the parts and sections the user's permissions allow.
 * Route: /app/help, ?section=<id> opens it at a part or section (contextual Help buttons); a
 * section this user does not have opens the start of the guide.
 */
function HelpPage() {
  const { user } = useAuth()
  const [lang, setLang] = useHelpLanguage(user?._id)
  const { guide, isLoading, error, retry } = useHelp(lang)
  const [searchParams, setSearchParams] = useSearchParams()
  const section = searchParams.get('section')
  const topId = useId()

  useEffect(() => {
    if (!guide) return
    const target = (section && document.getElementById(helpAnchor(section))) || null
    const element = target ?? document.getElementById(topId)
    element?.scrollIntoView?.({ block: 'start' })
  }, [guide, section, topId])

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
            data-print="hide"
            className="lg:sticky lg:top-0 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto bg-surface dark:bg-surface-dark border border-border-default dark:border-border-dark rounded-xl p-4"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            lang={lang}
          >
            <Contents parts={guide.parts} onOpen={open} />
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
                    <h3 id={`${helpAnchor(item.id)}-title`} className={SECTION_TITLE}>
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
