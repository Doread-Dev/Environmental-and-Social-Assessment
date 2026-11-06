// Settings shared by the Playwright config, the server start script and the specs.
// Everything here is for a throw-away test database: nothing is a real secret.
import path from 'node:path'

export const E2E_ROOT = path.resolve(import.meta.dirname, '..')
export const REPO_ROOT = path.resolve(E2E_ROOT, '..')
export const BUILD_DIR = path.join(E2E_ROOT, '.build')
export const DIST_DIR = path.join(BUILD_DIR, 'dist')
export const UPLOADS_DIR = path.join(BUILD_DIR, 'uploads')

// Not the owner's dev ports (3000/3001 backend, 5173/5174 Vite).
export const PORT = Number(process.env.E2E_PORT || 3100)
export const BASE_URL = `http://127.0.0.1:${PORT}`
export const API_URL = `${BASE_URL}/api/v1`

// Its own database, so a run never touches esms or the backend tests' esms_test.
export const MONGODB_URI = process.env.E2E_MONGODB_URI || 'mongodb://127.0.0.1:27017/esms_e2e_test'

// Fixed so the specs can sign an expired token for the session-expiry flow.
export const JWT_SECRET = 'e2e-only-jwt-secret-for-the-throwaway-test-database'

// The bootstrap admin made by scripts/start-server.mjs (create-admin.js, as on a new server).
export const ADMIN = {
  name: 'E2E Admin',
  email: 'e2e.admin@example.com',
  password: 'E2e-admin-pass-1',
}

// Password every user created by the specs ends up with (after the forced change).
export const USER_PASSWORD = 'E2e-user-pass-1'

// Refuses anything but a database whose name ends in _test (same rule as the backend tests).
export function assertTestDatabase(uri) {
  const name = new URL(uri).pathname.replace(/^\//, '')
  if (!name.endsWith('_test')) {
    throw new Error(`E2E refuses database "${name}": its name must end in _test`)
  }
  return name
}
