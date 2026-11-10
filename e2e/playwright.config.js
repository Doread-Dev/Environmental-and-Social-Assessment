// E2E of the golden flows (phase 12, D39, D76 2): Chromium only, against the production-style
// single process on its own port and its own _test database.
import { defineConfig, devices } from '@playwright/test'
import { BASE_URL, PORT } from './support/env.js'

const CI = Boolean(process.env.CI)

export default defineConfig({
  testDir: './tests',
  // The flows share one server and one database; each creates its own users and projects, and
  // runs its steps in order (test.describe.serial in the specs).
  fullyParallel: false,
  workers: 1,
  forbidOnly: CI,
  // No retries: a flaky test is a bug to fix, not to hide.
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: CI
    ? [['list'], ['html', { open: 'never' }], ['github']]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    acceptDownloads: true,
    locale: 'en-GB',
    timezoneId: 'UTC',
  },
  projects: [
    {
      name: 'chromium',
      // channel 'chromium': the full Chromium build in new headless mode (no separate headless
      // shell to download; closest to Chrome and Edge).
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    command: 'node scripts/start-server.mjs',
    url: `${BASE_URL}/health`,
    // Always a fresh server and database; never attach to something already on the port.
    reuseExistingServer: false,
    timeout: 120_000,
    // Server errors (stderr) show in the run; the request log (stdout) is left out.
    stdout: 'ignore',
    stderr: 'pipe',
    env: { E2E_PORT: String(PORT) },
  },
})
