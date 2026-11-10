// Connects each test file to the test database and empties it between tests.
import fs from "node:fs/promises";
import { afterAll, afterEach, beforeAll } from "vitest";
import { mongoose } from "../helpers/app.js";
import { assertTestDbName } from "../helpers/testDb.js";

async function clearDatabase() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
  await fs.rm(process.env.UPLOADS_DIR, { recursive: true, force: true });
}

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  assertTestDbName(mongoose.connection.name);
  await clearDatabase();
});

afterEach(clearDatabase);

afterAll(async () => {
  await mongoose.disconnect();
});
