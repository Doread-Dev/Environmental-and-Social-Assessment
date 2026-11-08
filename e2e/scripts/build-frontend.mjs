// Builds the frontend the way a release does (deploy/build-release.mjs): VITE_API_URL empty, so the
// app calls /api/v1 on its own origin. Output goes to e2e/.build/dist, never frontend/dist.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { DIST_DIR, REPO_ROOT } from '../support/env.js'

const frontend = path.join(REPO_ROOT, 'frontend')
if (!fs.existsSync(path.join(frontend, 'node_modules'))) {
  console.error('frontend/node_modules is missing: run "npm ci" in frontend first.')
  process.exit(1)
}

fs.rmSync(DIST_DIR, { recursive: true, force: true })
const vite = path.join(frontend, 'node_modules', 'vite', 'bin', 'vite.js')
const result = spawnSync(process.execPath, [vite, 'build', '--outDir', DIST_DIR, '--emptyOutDir'], {
  cwd: frontend,
  // An empty value wins over frontend/.env (Vite never overwrites a variable that is already set).
  env: { ...process.env, VITE_API_URL: '' },
  stdio: 'inherit',
})
if (result.status !== 0) process.exit(result.status ?? 1)

// Same guard as the release builder: Vite writes the value it used into the bundle; it must be empty.
const assets = path.join(DIST_DIR, 'assets')
for (const file of fs.readdirSync(assets).filter((f) => f.endsWith('.js'))) {
  const baked = /VITE_API_URL:"([^"]+)"/.exec(fs.readFileSync(path.join(assets, file), 'utf8'))
  if (baked) {
    console.error(`${file} has VITE_API_URL=${baked[1]}: the E2E build must call its own origin.`)
    process.exit(1)
  }
}
console.log(`Frontend built into ${DIST_DIR}`)
