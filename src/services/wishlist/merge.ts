/** Local (guest) → account wishlist merge (pure). Hooked up to login in the auth phase. */

export const MAX_WISHLIST_ITEMS = 100;

/** Union preserving the account's order first; de-duplicated and capped. */
export function mergeWishlistIds(
  account: string[],
  local: string[],
  max = MAX_WISHLIST_ITEMS,
): string[] {
  return [...new Set([...account, ...local])].slice(0, max);
}
