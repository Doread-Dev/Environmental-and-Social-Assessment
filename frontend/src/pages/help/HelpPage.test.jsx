import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import api from '@/services/api'
import HelpPage from './HelpPage'
import { HelpButton } from '@/components/help'
import { fail, ok, signIn } from '@/test/utils'
import { renderApp } from '@/test/renderApp'

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// What GET /help returns: only what the user's permissions allow (the server filters)
const GUIDE = {
  en: {
    lang: 'en',
    parts: [
      {
        id: 'quick-start',
        title: 'Quick start',
        intro: 'Start here.',
        sections: [
          {
            id: 'quick-start-everyone',
            title: 'First, for everyone',
            body: 'Press **Login**. See [the screening](#screening).',
          },
        ],
      },
      {
        id: 'screening',
        title: 'Tool 1 – Screening',
        intro: 'The first look at a project.',
        sections: [
          {
            id: 'screening-submit',
            title: 'Submit',
            body: '| Column | Meaning |\n|---|---|\n| **Status** | the state |',
          },
        ],
      },
    ],
  },
  ar: {
    lang: 'ar',
    parts: [
      {
        id: 'quick-start',
        title: 'البداية السريعة',
        intro: 'ابدأ هنا.',
        sections: [{ id: 'quick-start-everyone', title: 'أولًا، للجميع', body: 'اضغط **Login**.' }],
      },
    ],
  },
}

let guide

function renderPage(path = '/app/help', routes = []) {
  signIn({ user: { _id: 'u1', name: 'Sara', role: 'viewer' } })
  api.get.mockImplementation((url, config) => {
    if (url === '/auth/me') return ok({ user: { _id: 'u1', role: 'viewer' }, permissions: [] })
    if (url === '/help') {
      if (guide === 'fail') return fail(500, 'Server Error')
      return ok(guide[config?.params?.lang ?? 'en'])
    }
    return fail(404, `No mock for GET ${url}`)
  })
  return renderApp([{ path: '/app/help', element: <HelpPage /> }, ...routes], path)
}

const helpCalls = () => api.get.mock.calls.filter(([url]) => url === '/help')

describe('Help page (phase 14, D78)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    guide = structuredClone(GUIDE)
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('shows the guide the server sent, with a contents list of its parts and sections', async () => {
    renderPage()
    const article = await screen.findByRole('article', { name: 'User guide' })
    expect(
      within(article).getByRole('heading', { level: 2, name: 'Quick start' })
    ).toBeInTheDocument()
    expect(within(article).getByRole('heading', { level: 3, name: 'Submit' })).toBeInTheDocument()
    expect(within(article).getByRole('table')).toBeInTheDocument()
    const contents = screen.getByRole('navigation', { name: 'Contents' })
    expect(within(contents).getByText('Tool 1 – Screening')).toBeInTheDocument()
    expect(within(contents).getByText('First, for everyone')).toBeInTheDocument()
    expect(helpCalls()[0][1]).toEqual({ params: { lang: 'en' } })
    expect(article).toHaveAttribute('dir', 'ltr')
  })

  it('switches to Arabic (right to left) and remembers the choice for this user', async () => {
    const { unmount } = renderPage()
    await screen.findByRole('article', { name: 'User guide' })
    fireEvent.click(screen.getByRole('button', { name: 'العربية' }))
    const article = await screen.findByRole('article', { name: 'User guide' })
    await waitFor(() => expect(within(article).getByText('البداية السريعة')).toBeInTheDocument())
    expect(article).toHaveAttribute('dir', 'rtl')
    expect(article).toHaveAttribute('lang', 'ar')
    expect(screen.getByRole('button', { name: 'العربية' })).toHaveAttribute('aria-pressed', 'true')
    expect(localStorage.getItem('esms-help-lang:u1')).toBe('ar')
    unmount()

    renderPage()
    const again = await screen.findByRole('article', { name: 'User guide' })
    await waitFor(() => expect(within(again).getByText('البداية السريعة')).toBeInTheDocument())
    expect(helpCalls().at(-1)[1]).toEqual({ params: { lang: 'ar' } })
  })

  it('opens at the section in ?section=, or at the start when the user has no such section', async () => {
    const { unmount } = renderPage('/app/help?section=screening')
    await screen.findByRole('article', { name: 'User guide' })
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled())
    expect(Element.prototype.scrollIntoView.mock.contexts.at(-1).id).toBe('help-screening')
    unmount()

    vi.mocked(Element.prototype.scrollIntoView).mockClear()
    renderPage('/app/help?section=users')
    await screen.findByRole('article', { name: 'User guide' })
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled())
    const target = Element.prototype.scrollIntoView.mock.contexts.at(-1)
    expect(target).toContainElement(screen.getByRole('heading', { level: 1, name: 'Help' }))
  })

  it('a link in the guide opens its section on this page', async () => {
    renderPage()
    const article = await screen.findByRole('article', { name: 'User guide' })
    vi.mocked(Element.prototype.scrollIntoView).mockClear()
    fireEvent.click(within(article).getByRole('link', { name: 'the screening' }))
    await waitFor(() =>
      expect(Element.prototype.scrollIntoView.mock.contexts.at(-1)?.id).toBe('help-screening')
    )
  })

  it('renders the Markdown as elements only: raw HTML and outside links are not rendered', async () => {
    guide.en.parts[0].sections[0].body =
      'Text <script>window.hacked = true</script> <img src="x" onerror="window.hacked = true">' +
      ' [bad](javascript:alert(1)) [out](https://example.com) <b>raw</b>'
    const { container } = renderPage()
    await screen.findByRole('article', { name: 'User guide' })
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('b')).toBeNull()
    expect(container.querySelector('a[href^="javascript"]')).toBeNull()
    expect(container.querySelector('a[href^="https"]')).toBeNull()
    expect(screen.getByText(/bad/)).toBeInTheDocument()
    expect(window.hacked).toBeUndefined()
  })

  it('shows Try again when the guide cannot be loaded', async () => {
    guide = 'fail'
    renderPage()
    expect(await screen.findByText('Could not load the guide')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Try again/ })).toBeInTheDocument()
  })

  it('Print uses the browser print', async () => {
    window.print = vi.fn()
    renderPage()
    await screen.findByRole('article', { name: 'User guide' })
    fireEvent.click(screen.getByRole('button', { name: /Print/ }))
    expect(window.print).toHaveBeenCalled()
  })
})

describe('Help button (contextual help by place key)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    guide = structuredClone(GUIDE)
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('opens the Help page at the section of its place', async () => {
    renderPage('/tool', [{ path: '/tool', element: <HelpButton place="screening" /> }])
    fireEvent.click(await screen.findByRole('button', { name: 'Help for this page' }))
    await screen.findByRole('article', { name: 'User guide' })
    await waitFor(() =>
      expect(Element.prototype.scrollIntoView.mock.contexts.at(-1)?.id).toBe('help-screening')
    )
  })

  it('renders nothing on a page without a place', () => {
    renderPage('/tool', [{ path: '/tool', element: <HelpButton place={null} /> }])
    expect(screen.queryByRole('button', { name: 'Help for this page' })).toBeNull()
  })

  it('every page with a place key shows it, next to its Guidance button', () => {
    for (const file of [
      'components/layout/ProjectLayout.jsx',
      'components/layout/SempFullWidthLayout.jsx',
    ]) {
      const text = fs.readFileSync(path.join(SRC, file), 'utf8')
      expect(text, file).toMatch(
        /<HelpButton place=\{place\} \/>\s*<GuidanceButton place=\{place\} \/>/
      )
    }
  })
})

describe('Help chunk', () => {
  it('is lazy: the page and the Markdown renderer are only loaded by the /help route', () => {
    const routes = fs.readFileSync(path.join(SRC, 'routes/index.jsx'), 'utf8')
    expect(routes).toMatch(/const HelpPage = lazy\(\(\) => import\('@\/pages\/help\/HelpPage'\)\)/)
    expect(routes).not.toMatch(/^import .*pages\/help/m)
    const walk = (dir) =>
      fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))
    const importers = walk(SRC)
      .filter((f) => /\.jsx?$/.test(f) && !/\.test\.jsx?$/.test(f))
      .filter((f) =>
        // a static import; the route's lazy import() is checked above
        /^import [^\n]*('react-markdown'|'remark-gfm'|pages\/help)/m.test(
          fs.readFileSync(f, 'utf8')
        )
      )
      .map((f) => path.relative(SRC, f).split(path.sep).join('/'))
    expect(importers).toEqual(['pages/help/HelpPage.jsx'])
  })
})
