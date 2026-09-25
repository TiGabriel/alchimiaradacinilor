/** Guest → account cart merge (pure). Hooked up to login in the auth phase. */
import { MAX_QUANTITY_PER_LINE } from "./calculate";

export type CartQuantity = { productId: string; quantity: number };

/**
 * Sums quantities per product (guest items added to the account's items),
 * capped at the per-line maximum. Stock is re-checked on the next read.
 * Order: account items first, then new guest items.
 */
export function mergeCartItems(account: CartQuantity[], guest: CartQuantity[]): CartQuantity[] {
  const merged = new Map<string, number>();
  for (const item of [...account, ...guest]) {
    if (item.quantity <= 0) continue;
    merged.set(
      item.productId,
      Math.min(MAX_QUANTITY_PER_LINE, (merged.get(item.productId) ?? 0) + item.quantity),
    );
  }
  return [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}
