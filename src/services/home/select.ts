/** Pure homepage selection helpers (no I/O; tested). */

import type { CategoryNode } from "@/services/catalog/category-tree";

/** Minimal product shape these helpers need. */
type ProductLike = { id: string; slug: string; stock: number };

export type Essential<P> = { product: P; note: string; position: number };

/**
 * "Cele 5 esențiale": keeps the configured order, drops slugs that are missing
 * or inactive (absent from `products`) and duplicates. Out-of-stock products stay:
 * the section is editorial, the card shows availability.
 */
export function resolveEssentials<P extends ProductLike>(
  config: Array<{ slug: string; note: string }>,
  products: P[],
): Array<Essential<P>> {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const seen = new Set<string>();
  const out: Array<Essential<P>> = [];
  for (const item of config) {
    const product = bySlug.get(item.slug);
    if (!product || seen.has(product.id)) continue;
    seen.add(product.id);
    out.push({ product, note: item.note, position: out.length + 1 });
  }
  return out;
}

/** The section only makes sense as a small curated set. */
export const MIN_ESSENTIALS = 3;

/** Top-level categories with products, most stocked first (stable for ties). */
export function popularCategories(tree: CategoryNode[], limit = 6): CategoryNode[] {
  return tree
    .map((node, index) => ({ node, index }))
    .filter(({ node }) => node.productCount > 0)
    .sort((a, b) => b.node.productCount - a.node.productCount || a.index - b.index)
    .slice(0, limit)
    .map(({ node }) => node);
}

export type PersonalItem<P> = { product: P; reason: string | null };
export type PersonalRow<P> = { source: "quiz" | "favourites"; items: Array<PersonalItem<P>> };

/**
 * "Recomandat pentru tine": the latest quiz result wins (explicit choices), topped
 * up from favourite-based suggestions (consented). Only in-stock products, no duplicates.
 * Returns null when there is nothing personal to show.
 */
export function buildPersonalRow<P extends ProductLike>(
  quizItems: Array<PersonalItem<P>>,
  favouriteItems: Array<PersonalItem<P>>,
  limit = 4,
): PersonalRow<P> | null {
  const seen = new Set<string>();
  const items: Array<PersonalItem<P>> = [];
  const take = (list: Array<PersonalItem<P>>) => {
    for (const item of list) {
      if (items.length >= limit) return;
      if (item.product.stock <= 0 || seen.has(item.product.id)) continue;
      seen.add(item.product.id);
      items.push(item);
    }
  };
  take(quizItems);
  const fromQuiz = items.length;
  take(favouriteItems);
  if (items.length === 0) return null;
  return { source: fromQuiz > 0 ? "quiz" : "favourites", items };
}

/** Public reviewer name: first name + last initial ("Ioana M."); never the full name or email. */
export function reviewerName(firstName: string | null, lastName: string | null): string {
  const first = firstName?.trim();
  const initial = lastName?.trim().charAt(0);
  if (!first) return "Client verificat";
  return initial ? `${first} ${initial.toLocaleUpperCase("ro-RO")}.` : first;
}
