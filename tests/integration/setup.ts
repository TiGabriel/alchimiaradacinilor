import { afterAll, beforeEach, vi } from "vitest";

import { db } from "@/lib/db";

// Keep console output readable (the console email provider logs every message).
vi.spyOn(console, "info").mockImplementation(() => {});

/** Every test starts from an empty database (schema kept, migrations table untouched). */
beforeEach(async () => {
  const tables = await db.$queryRawUnsafe<Array<{ tablename: string }>>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'",
  );
  if (tables.length === 0) return;
  await db.$executeRawUnsafe(
    `TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`,
  );
});

afterAll(async () => {
  await db.$disconnect();
});
