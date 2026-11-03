import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    setupFiles: ["tests/setup/env.js", "tests/setup/db.js"],
    // All test files share one database, so run them one at a time.
    fileParallelism: false,
    silent: "passed-only",
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
