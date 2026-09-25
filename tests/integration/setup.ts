import { afterAll, beforeEach, vi } from "vitest";

import { db } from "@/lib/db";

// Keep console output readable (the console email provider logs every message).
vi.spyOn(console, "info").mockImplementation(() => {});

const TABLES = [
  "consent_records",
  "newsletter_subscribers",
  "sessions",
  "accounts",
  "verifications",
  "user_roles",
  "addresses",
  "cart_items",
  "carts",
  "wishlist_items",
  "wishlists",
  "quiz_result_products",
  "quiz_result_answers",
  "quiz_results",
  "saved_routines",
  "order_items",
  "order_addresses",
  "coupon_usages",
  "orders",
  "users",
  "product_tags",
  "product_needs",
  "product_aroma_profiles",
  "product_relations",
  "kit_items",
  "routine_products",
  "routine_steps",
  "routine_needs",
  "article_products",
  "products",
  "categories",
  "brands",
  "roles",
  "site_settings",
];

beforeEach(async () => {
  const existing = await db.$queryRawUnsafe<Array<{ tablename: string }>>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
  );
  const names = new Set(existing.map((t) => t.tablename));
  const toTruncate = TABLES.filter((t) => names.has(t))
    .map((t) => `"${t}"`)
    .join(", ");
  await db.$executeRawUnsafe(`TRUNCATE ${toTruncate} RESTART IDENTITY CASCADE`);
});

afterAll(async () => {
  await db.$disconnect();
});
