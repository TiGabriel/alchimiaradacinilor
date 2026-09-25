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

export async function makeVerifiedUser(overrides: Partial<Record<string, string>> = {}) {
  const user = await makeUser(overrides);
  await db.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
  return user;
}

export const testAddress = {
  label: null,
  firstName: "Ana",
  lastName: "Pop",
  phone: "0722123456",
  street: "Str. Florilor 1",
  streetExtra: null,
  city: "Cluj-Napoca",
  county: "Cluj" as const,
  postalCode: "400001",
  companyName: null,
  vatNumber: null,
  tradeRegisterNo: null,
  isDefaultShipping: false,
  isDefaultBilling: false,
};

/** Places a real order for `quantity` of each product (cart → placeOrder). */
export async function placeTestOrder(userId: string, productIds: string[], quantity = 1) {
  const { loadCartView } = await import("@/services/cart/cart");
  const { placeOrder } = await import("@/services/orders/place");
  await db.cart.upsert({
    where: { userId },
    create: { userId, items: { create: productIds.map((productId) => ({ productId, quantity })) } },
    update: {
      items: { deleteMany: {}, create: productIds.map((productId) => ({ productId, quantity })) },
    },
  });
  const view = await loadCartView({ userId, token: null });
  return placeOrder(userId, {
    shipping: { kind: "new", address: testAddress, save: false },
    billing: { kind: "same" },
    shippingMethod: "curier",
    paymentMethod: "CASH_ON_DELIVERY",
    acceptTerms: true,
    expectedTotal: view.total,
  });
}
