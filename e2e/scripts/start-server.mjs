// The Playwright webServer: prepares a fresh E2E database, then runs the backend's own entry point
// (src/server.js, what `npm start` runs) in this process with NODE_ENV=production, serving the
// frontend build of scripts/build-frontend.mjs on the same origin (D38, phase 11).
//
// 1. Refuses any database whose name does not end in _test, then drops it.
// 2. Fills the lookups with the same data as `npm run seed` (seedLookupData).
// 3. Creates the bootstrap admin the way scripts/create-admin.js does (no forced change).
// Other users are created by the specs through the admin API, like on a real server.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import {
  ADMIN,
  DIST_DIR,
  JWT_SECRET,
  MONGODB_URI,
  PORT,
  REPO_ROOT,
  UPLOADS_DIR,
  assertTestDatabase,
} from '../support/env.js'

const backend = path.join(REPO_ROOT, 'backend')
const requireBackend = createRequire(path.join(backend, 'package.json'))

if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  console.error(
    'No frontend build in e2e/.build/dist: run "npm run build:frontend" (or "npm test").'
  )
  process.exit(1)
}
assertTestDatabase(MONGODB_URI)

// Every setting the server reads is set here, so nothing comes from a developer's backend/.env
// (dotenv never overwrites a variable that is already set, even to an empty value).
Object.assign(process.env, {
  NODE_ENV: 'production',
  PORT: String(PORT),
  HOST: '127.0.0.1',
  MONGODB_URI,
  JWT_SECRET,
  JWT_EXPIRES_IN: '12h',
  FRONTEND_DIST: DIST_DIR,
  FRONTEND_URL: '',
  TRUST_PROXY: '',
  UPLOADS_DIR,
  MAX_UPLOAD_MB: '10',
})

fs.rmSync(UPLOADS_DIR, { recursive: true, force: true })
fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const mongoose = requireBackend('mongoose')
const { seedLookupData } = requireBackend('./src/db/seed.js')
const User = requireBackend('./src/models/user.model.js')

await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
await mongoose.connection.dropDatabase()
// The unique indexes must exist before the specs run (duplicate checks answer 409).
await Promise.all(Object.values(mongoose.models).map((model) => model.init()))
await seedLookupData()
await User.create({ ...ADMIN, role: 'admin', is_active: true })
await mongoose.disconnect()
console.log(`E2E database ${assertTestDatabase(MONGODB_URI)} ready`)

// The real entry point; it connects again and listens on PORT.
requireBackend('./src/server.js')
