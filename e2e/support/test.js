// The `test` every spec imports: Playwright's, plus two things the flows need.
//
// 1. File downloads pass through Playwright. Under Playwright's Chromium (1.65 / Chromium 158),
//    a fetch whose response carries `Content-Disposition: attachment` reaches the page as an empty
//    204, although the server sends 200 with the file (server log; Chrome 152 outside Playwright
//    gets the bytes). The app fetches project files and library PDFs that way (PdfViewer, row
//    downloads), so those two endpoints are fetched by Playwright and handed to the page with the
//    server's status, headers and body unchanged (route.fetch → fulfill). Nothing else is routed.
// 2. `newUserPage()`: a page in a fresh browser context (a second user or a second tab of the
//    same user), with the same routing, closed after the test.
import { test as base, expect } from '@playwright/test'

const FILE_ENDPOINT = /^\/api\/v1\/(files\/[0-9a-f]{24}\/download|library\/[0-9a-f]{24}\/file)$/

export async function passFileDownloads(context) {
  await context.route(
    (url) => FILE_ENDPOINT.test(url.pathname),
    async (route) => route.fulfill({ response: await route.fetch() })
  )
}

export const test = base.extend({
  context: async ({ context }, use) => {
    await passFileDownloads(context)
    await use(context)
  },
  newUserPage: async ({ browser }, use) => {
    const contexts = []
    await use(async () => {
      const context = await browser.newContext()
      await passFileDownloads(context)
      contexts.push(context)
      return context.newPage()
    })
    for (const context of contexts) await context.close()
  },
})

export { expect }
