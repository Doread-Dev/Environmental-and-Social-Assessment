// Runs before every test file, before the app is loaded.
import os from "node:os";
import path from "node:path";
import dotenv from "dotenv";
import { resolveTestUri, assertTestUri } from "../helpers/testDb.js";

dotenv.config({ quiet: true });

process.env.NODE_ENV = "test";

const testUri = resolveTestUri();
assertTestUri(testUri);
// Point everything (including code that reads MONGODB_URI) at the test database.
process.env.MONGODB_URI = testUri;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length < 32) {
  process.env.JWT_SECRET = "test-only-jwt-secret-at-least-32-characters";
}

// Uploaded files go to a throw-away folder, never to backend/uploads (emptied after each test).
process.env.UPLOADS_DIR = path.join(os.tmpdir(), `esms-test-uploads-${process.pid}`);
delete process.env.MAX_UPLOAD_MB;
