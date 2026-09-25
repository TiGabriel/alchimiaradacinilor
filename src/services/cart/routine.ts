import "server-only";

import { getRoutineCartItems } from "@/services/routines/routines";
import { planRoutineCart, type RoutineCartPlan } from "@/services/routines/routine-cart";

import { addCartItem, loadCartView, type CartOwner, type CartView } from "./cart";

/**
 * Adds every in-stock product of a routine (quantity 1, skipping what is
 * already in the cart). Stock is re-checked by the cart service for each add.
 */
export async function addRoutineToCart(
  owner: CartOwner,
  routineId: string,
): Promise<{
  view: CartView;
  added: string[];
  skipped: RoutineCartPlan["skipped"];
  token: string | null;
}> {
  const [items, current] = await Promise.all([getRoutineCartItems(routineId), loadCartView(owner)]);
  const plan = planRoutineCart(items, new Set(current.lines.map((l) => l.productId)));

  let token = owner.token;
  const added: string[] = [];
  const skipped = [...plan.skipped];
  let view = current;
  for (const item of plan.toAdd) {
    try {
      const result = await addCartItem({ ...owner, token }, item.productId, item.quantity);
      token = result.token ?? token;
      view = result.view;
      added.push(item.name);
    } catch {
      // Stock can change between planning and adding.
      skipped.push({ productId: item.productId, name: item.name, reason: "out-of-stock" });
    }
  }
  return { view, added, skipped, token: token !== owner.token ? token : null };
}
