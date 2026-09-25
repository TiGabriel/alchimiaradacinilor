import "dotenv/config";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Integration tests run against a real PostgreSQL database (DATABASE_URL_TEST),
 * migrated in globalSetup and truncated between tests. Run: pnpm test:integration
 */
const testUrl = process.env.DATABASE_URL_TEST;
if (!testUrl)
  throw new Error("DATABASE_URL_TEST must be set for integration tests (see .env.example).");

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.int.test.ts"],
    setupFiles: ["./tests/setup.ts", "./tests/integration/setup.ts"],
    globalSetup: ["./tests/integration/global-setup.ts"],
    env: { DATABASE_URL: testUrl, NODE_ENV: "test", EMAIL_PROVIDER: "console" },
    fileParallelism: false,
    restoreMocks: true,
    testTimeout: 20_000,
  },
});
