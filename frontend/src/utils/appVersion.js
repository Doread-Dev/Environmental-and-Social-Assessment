/**
 * The release version (D77), from frontend/package.json at build time. Shown at the bottom of the
 * header's user menu so IT can tell which build runs; the backend reports its own in GET /health.
 */
import { version } from '../../package.json'

export const APP_VERSION = version
