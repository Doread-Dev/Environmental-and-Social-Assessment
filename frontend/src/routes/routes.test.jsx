import { describe, expect, it } from 'vitest'
import { router } from './index'
import { MAIN_NAV_ITEMS, PROJECT_SECONDARY_NAV, ROUTES, getHelpRoute } from './routes.config'

// Every route of the app with its full path and handle
function flatten(routes, parent = '') {
  return routes.flatMap((route) => {
    const path = route.path?.startsWith('/')
      ? route.path
      : [parent, route.path].filter(Boolean).join('/')
    return [{ path, handle: route.handle }, ...flatten(route.children ?? [], path)]
  })
}

const all = flatten(router.routes)
const placeOf = (path) => {
  // The deepest route on the way to `path` that names a place (as useCurrentPlace does)
  const chain = all.filter((r) => r.path && path.startsWith(r.path))
  return chain.reverse().find((r) => r.handle?.place)?.handle.place ?? null
}

describe('app routes (D64)', () => {
  it('each tool page names its place, so the header shows its Guidance button', () => {
    const p = '/app/projects/:projectId'
    expect(placeOf(`${p}/screening`)).toBe('screening')
    expect(placeOf(`${p}/screening/summary`)).toBe('screening')
    expect(placeOf(`${p}/assessment/scoring`)).toBe('assessment')
    expect(placeOf(`${p}/semp/activities`)).toBe('management')
    expect(placeOf(`${p}/semp/mitigation`)).toBe('mitigation')
    expect(placeOf(`${p}/monitoring/data-entry`)).toBe('monitoring')
    expect(placeOf(`${p}/overview`)).toBeNull()
    expect(placeOf(`${p}/documents`)).toBeNull()
  })

  it('only the five project-workflow places are used in v2', () => {
    const used = [...new Set(all.map((r) => r.handle?.place).filter(Boolean))].sort()
    expect(used).toEqual(['assessment', 'management', 'mitigation', 'monitoring', 'screening'])
  })

  it('has no route for the v3 modules, which are locked buttons only (D48, D70)', () => {
    const v3 = /semp-plan|stakeholder|organization|ghg|environmental-data/i
    expect(all.filter((r) => r.path && v3.test(r.path))).toEqual([])
    expect(Object.values(ROUTES).filter((path) => v3.test(path))).toEqual([])
  })

  it('has the Library in the main navigation and Documents instead of Annex', () => {
    expect(MAIN_NAV_ITEMS.map((item) => item.id)).toEqual([
      'dashboard',
      'projects',
      'library',
      'help',
    ])
    expect(MAIN_NAV_ITEMS.find((item) => item.id === 'library').path).toBe(ROUTES.LIBRARY)
    expect(PROJECT_SECONDARY_NAV.map((item) => [item.id, item.label])).toEqual([
      ['documents', 'Documents'],
    ])
    const paths = all.map((r) => r.path)
    expect(paths).toContain(ROUTES.LIBRARY)
    expect(paths).toContain(ROUTES.PROJECT_DOCUMENTS)
    expect(paths.some((path) => path.endsWith('/annex'))).toBe(false)
  })

  it('has the Help page for every role in the main navigation (D78)', () => {
    expect(MAIN_NAV_ITEMS.find((item) => item.id === 'help').path).toBe(ROUTES.HELP)
    expect(all.map((r) => r.path)).toContain(ROUTES.HELP)
    expect(getHelpRoute()).toBe('/app/help')
    expect(getHelpRoute('screening')).toBe('/app/help?section=screening')
  })
})
