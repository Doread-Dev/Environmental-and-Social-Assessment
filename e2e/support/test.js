// The `test` every spec imports: Playwright's, plus `newUserPage()` — a page in a fresh browser
// context (a second user or a second tab of the same user), closed after the test.
// Nothing is routed or mocked: file downloads and PDF previews go through the real API.
import { test as base, expect } from '@playwright/test'

export const test = base.extend({
  newUserPage: async ({ browser }, use) => {
    const contexts = []
    await use(async () => {
      const context = await browser.newContext()
      contexts.push(context)
      return context.newPage()
    })
    for (const context of contexts) await context.close()
  },
})

export { expect }
