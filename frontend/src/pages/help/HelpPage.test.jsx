import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import api from '@/services/api'
import HelpPage from './HelpPage'
import { FloatingHelpButton } from '@/components/help'
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

describe('Help contents follow the reading position (scroll-spy)', () => {
  let observers
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    guide = structuredClone(GUIDE)
    Element.prototype.scrollIntoView = vi.fn()
    observers = []
    window.IntersectionObserver = class {
      constructor(callback, options) {
        this.callback = callback
        this.options = options
        this.targets = []
        observers.push(this)
      }
      observe(target) {
        this.targets.push(target)
      }
      disconnect() {
        this.targets = []
      }
    }
  })

  const heading = (id) => document.querySelector(`[data-help-id="${id}"]`)
  // Where each heading is on screen (px from the top); the band reaches down to 240 px
  const place = (positions) => {
    Object.entries(positions).forEach(([id, top]) => {
      heading(id).getBoundingClientRect = () => ({ top, bottom: top + 30 })
    })
  }
  const report = (observer) =>
    act(() => observer.callback([{ rootBounds: { top: 0, bottom: 240 } }]))
  const current = () =>
    within(screen.getByRole('navigation', { name: 'Contents' })).getByRole('link', {
      current: 'location',
    })

  it('highlights the part or section in view, without a scroll listener', async () => {
    const addListener = vi.spyOn(window, 'addEventListener')
    renderPage()
    await screen.findByRole('article', { name: 'User guide' })
    const observer = observers.at(-1)
    expect(observer.options.rootMargin).toBe('0px 0px -70% 0px')
    expect(observer.targets.map((t) => t.dataset.helpId)).toEqual([
      'quick-start',
      'quick-start-everyone',
      'screening',
      'screening-submit',
    ])
    expect(current()).toHaveTextContent('Quick start')

    // Scrolled down: Submit has reached the band
    place({
      'quick-start': -900,
      'quick-start-everyone': -700,
      screening: -100,
      'screening-submit': 200,
    })
    report(observer)
    expect(current()).toHaveTextContent('Submit')
    expect(current()).toHaveAttribute('href', '#help-screening-submit')

    // Back up: Submit is below the band again, the part above it is being read
    place({
      'quick-start': -600,
      'quick-start-everyone': -400,
      screening: 100,
      'screening-submit': 500,
    })
    report(observer)
    expect(current()).toHaveTextContent('Tool 1 – Screening')

    // A jump to the end lands right too
    place({
      'quick-start': -3000,
      'quick-start-everyone': -2800,
      screening: -2000,
      'screening-submit': -50,
    })
    report(observer)
    expect(current()).toHaveTextContent('Submit')
    expect(addListener.mock.calls.filter(([type]) => type === 'scroll')).toEqual([])
  })

  it('works the same in Arabic (right to left)', async () => {
    renderPage()
    await screen.findByRole('article', { name: 'User guide' })
    fireEvent.click(screen.getByRole('button', { name: 'العربية' }))
    await waitFor(() =>
      expect(screen.getByRole('article', { name: 'User guide' })).toHaveAttribute('dir', 'rtl')
    )
    await waitFor(() => expect(heading('quick-start-everyone')).not.toBeNull())
    place({ 'quick-start': -300, 'quick-start-everyone': 120 })
    report(observers.at(-1))
    expect(current()).toHaveTextContent('أولًا، للجميع')
  })

  it('clicking an item still jumps to it and highlights it', async () => {
    renderPage()
    await screen.findByRole('article', { name: 'User guide' })
    const contents = screen.getByRole('navigation', { name: 'Contents' })
    fireEvent.click(within(contents).getByRole('link', { name: 'Submit' }))
    await waitFor(() =>
      expect(Element.prototype.scrollIntoView.mock.contexts.at(-1)?.id).toBe(
        'help-screening-submit'
      )
    )
    expect(current()).toHaveTextContent('Submit')
  })
})

describe('Floating Help button (contextual help, routes/helpSections.js)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    guide = structuredClone(GUIDE)
    Element.prototype.scrollIntoView = vi.fn()
  })

  // A page of the app, under its real path, with the button as the layouts mount it
  const page = (path) => ({
    path,
    element: (
      <>
        <p>a page</p>
        <FloatingHelpButton />
      </>
    ),
  })

  it('opens the guide at the first section of the page the user has', async () => {
    renderPage('/app/projects/p1/screening/summary', [page('/app/projects/:id/screening/summary')])
    fireEvent.click(await screen.findByRole('button', { name: 'Help for this page' }))
    await screen.findByRole('article', { name: 'User guide' })
    // screening-review and screening-after-review are not in this user's guide: the part opens
    await waitFor(() =>
      expect(Element.prototype.scrollIntoView.mock.contexts.at(-1)?.id).toBe('help-screening')
    )
  })

  it('opens the start of the guide when none of the page sections is in the user guide', async () => {
    renderPage('/app/settings', [page('/app/settings')])
    fireEvent.click(await screen.findByRole('button', { name: 'Help for this page' }))
    await screen.findByRole('article', { name: 'User guide' })
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled())
    const target = Element.prototype.scrollIntoView.mock.contexts.at(-1)
    expect(target).toContainElement(screen.getByRole('heading', { level: 1, name: 'Help' }))
  })

  it('is a labelled, focusable button with a focus ring', async () => {
    renderPage('/app/dashboard', [page('/app/dashboard')])
    const button = await screen.findByRole('button', { name: 'Help for this page' })
    button.focus()
    expect(button).toHaveFocus()
    expect(button.className).toMatch(/focus-visible:ring/)
    expect(button.className.split(' ')).toContain('fixed')
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
