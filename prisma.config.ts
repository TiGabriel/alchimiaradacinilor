import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer reads .env on its own, hence the dotenv import above.
// DATABASE_URL may be absent for `prisma generate` (e.g. in CI builds), so it is
// read directly instead of via env(), which would throw.
// DIRECT_DATABASE_URL (optional): the non-pooled URL of a managed database (Neon…) for
// migrations; the app itself always connects with DATABASE_URL (src/lib/db.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed/index.ts",
  },
  datasource: {
    url: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL,
  },
});
