/** "Adaugă produsele rutinei în coș" — which products go in, which are skipped and why. Pure. */

export type RoutineItem = {
  productId: string;
  name: string;
  active: boolean;
  stock: number;
  optional: boolean;
};

export type SkipReason = "out-of-stock" | "unavailable" | "already-in-cart";

export type RoutineCartPlan = {
  toAdd: Array<{ productId: string; name: string; quantity: 1 }>;
  skipped: Array<{ productId: string; name: string; reason: SkipReason }>;
};

export const skipReasonText: Record<SkipReason, string> = {
  "out-of-stock": "nu mai este în stoc",
  unavailable: "nu mai este disponibil",
  "already-in-cart": "este deja în coș",
};

/**
 * Every in-stock, active product is added once (quantity 1). Products already
 * in the cart are left as they are. Optional products are included — the
 * routine page lets the customer remove them afterwards.
 */
export function planRoutineCart(
  items: RoutineItem[],
  cartProductIds: ReadonlySet<string>,
): RoutineCartPlan {
  const plan: RoutineCartPlan = { toAdd: [], skipped: [] };
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.productId)) continue;
    seen.add(item.productId);
    if (!item.active)
      plan.skipped.push({ productId: item.productId, name: item.name, reason: "unavailable" });
    else if (item.stock <= 0)
      plan.skipped.push({ productId: item.productId, name: item.name, reason: "out-of-stock" });
    else if (cartProductIds.has(item.productId))
      plan.skipped.push({ productId: item.productId, name: item.name, reason: "already-in-cart" });
    else plan.toAdd.push({ productId: item.productId, name: item.name, quantity: 1 });
  }
  return plan;
}

/** Friendly summary for the toast after adding a routine. */
export function describeRoutinePlan(added: string[], skipped: RoutineCartPlan["skipped"]): string {
  const parts: string[] = [];
  if (added.length) parts.push(`Am adăugat în coș: ${added.join(", ")}.`);
  const missing = skipped.filter((s) => s.reason !== "already-in-cart");
  const present = skipped.filter((s) => s.reason === "already-in-cart");
  if (missing.length)
    parts.push(
      `Nu am putut adăuga: ${missing.map((s) => `${s.name} (${skipReasonText[s.reason]})`).join(", ")}.`,
    );
  if (present.length) parts.push(`Deja în coș: ${present.map((s) => s.name).join(", ")}.`);
  return parts.join(" ") || "Nu a fost nimic de adăugat.";
}
