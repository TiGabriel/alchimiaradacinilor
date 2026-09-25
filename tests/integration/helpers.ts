import { db } from "@/lib/db";
import { registerUser } from "@/services/auth/accounts";
import { registerSchema } from "@/validation/auth";

export const meta = { source: "test", ipHash: "hash", userAgent: "vitest" };

export async function makeUser(overrides: Partial<Record<string, string>> = {}) {
  const input = registerSchema.parse({
    firstName: "Ana",
    lastName: "Pop",
    email: "ana@example.ro",
    password: "lavanda2026",
    confirmPassword: "lavanda2026",
    privacyConsent: "on",
    ...overrides,
  });
  return registerUser(input, meta);
}

export async function makeProduct(
  overrides: { slug?: string; stock?: number; price?: number } = {},
) {
  const category = await db.category.upsert({
    where: { slug: "test" },
    create: { slug: "test", name: "Test" },
    update: {},
  });
  const slug = overrides.slug ?? `p-${Math.random().toString(36).slice(2, 8)}`;
  return db.product.create({
    data: {
      slug,
      sku: slug.toUpperCase(),
      name: `Produs ${slug}`,
      categoryId: category.id,
      productType: "INDIVIDUAL_OIL",
      shortDescription: "x",
      description: "x",
      price: overrides.price ?? 4900,
      stock: overrides.stock ?? 10,
    },
  });
}
