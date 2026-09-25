import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer reads .env on its own, hence the dotenv import above.
// DATABASE_URL may be absent for `prisma generate` (e.g. in CI builds), so it is
// read directly instead of via env(), which would throw.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed/index.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
