/**
 * Recommendation engine — deterministic, explainable, pure (fully tested).
 *
 * Everything that "wants" something is a Signal (a need, aroma, tag or
 * product type with a weight). Signals come from quiz answers, selected
 * needs or (with consent) the customer's own activity. Candidates (products
 * today; routines and articles later) expose the same taxonomy, so one
 * scoring function serves every surface. No randomness, no AI.
 */
import type { ProductType } from "@/generated/prisma/enums";

export type SignalKind = "need" | "aroma" | "tag" | "productType";

export type Signal = { kind: SignalKind; key: string; label: string; weight: number };

export type Criteria = {
  signals: Signal[];
  /** Products priced above this (bani) are penalised. */
  maxPrice?: number | null;
  budgetLabel?: string | null;
  /** Personal context — pass only when the customer consented to personalisation. */
  context?: {
    wishlistIds?: readonly string[];
    purchasedIds?: readonly string[];
    routineProductIds?: readonly string[];
    viewedIds?: readonly string[];
  };
  excludeIds?: readonly string[];
};

export type EngineWeights = {
  need: number;
  aroma: number;
  tag: number;
  productType: number;
  budgetPenalty: number;
  wishlistAffinity: number;
  routineAffinity: number;
  viewedAffinity: number;
};

/** Taxonomy profile shared by every rankable item. */
export type Profile = {
  needs: Array<{ key: string; relevance: number }>;
  aromas: Array<{ key: string; intensity: number }>;
  tags: string[];
  productType?: ProductType | null;
};

export type ProductCandidate = Profile & {
  id: string;
  name: string;
  price: number;
  stock: number;
  active: boolean;
  featured: boolean;
  rating: number | null;
  reviewCount: number;
};

export type Contribution = {
  label: string;
  points: number;
  source: "choice" | "context" | "budget";
};

export type Ranked<T> = {
  item: T;
  score: number;
  contributions: Contribution[];
  explanation: string;
};

const round = (n: number) => Math.round(n * 100) / 100;

/** Merges duplicate signals (same kind + key) by summing weights; drops zero weights. */
export function mergeSignals(signals: Signal[]): Signal[] {
  const merged = new Map<string, Signal>();
  for (const s of signals) {
    const id = `${s.kind}:${s.key}`;
    const current = merged.get(id);
    merged.set(id, current ? { ...current, weight: current.weight + s.weight } : { ...s });
  }
  return [...merged.values()].filter((s) => s.weight !== 0);
}

/** Score of a profile against the signals, with a per-signal breakdown. */
export function scoreProfile(
  profile: Profile,
  signals: Signal[],
  weights: EngineWeights,
): Contribution[] {
  const contributions: Contribution[] = [];
  for (const signal of signals) {
    let points = 0;
    if (signal.kind === "need") {
      const match = profile.needs.find((n) => n.key === signal.key);
      if (match) points = signal.weight * weights.need * match.relevance;
    } else if (signal.kind === "aroma") {
      const match = profile.aromas.find((a) => a.key === signal.key);
      // Intensity 3 of 5 is neutral; a dominant note counts more than a hint.
      if (match) points = signal.weight * weights.aroma * (match.intensity / 3);
    } else if (signal.kind === "tag") {
      if (profile.tags.includes(signal.key)) points = signal.weight * weights.tag;
    } else if (signal.kind === "productType") {
      if (profile.productType === signal.key) points = signal.weight * weights.productType;
    }
    if (points !== 0)
      contributions.push({ label: signal.label, points: round(points), source: "choice" });
  }
  return contributions;
}

/** "Recomandat pentru că ai ales: Relaxare + Seară + Floral." (+ a context note). */
export function explain(contributions: Contribution[]): string {
  const choices = contributions
    .filter((c) => c.source === "choice" && c.points > 0)
    .sort((a, b) => b.points - a.points || a.label.localeCompare(b.label, "ro"));
  const labels = [...new Set(choices.map((c) => c.label))].slice(0, 3);
  const context = contributions.filter((c) => c.source === "context" && c.points > 0);
  const parts: string[] = [];
  if (labels.length) parts.push(`Recomandat pentru că ai ales: ${labels.join(" + ")}.`);
  if (context.length) parts.push(`Se potrivește și cu ${context[0]!.label}.`);
  return parts.join(" ") || "Recomandat pentru tine.";
}

function compareProducts(a: Ranked<ProductCandidate>, b: Ranked<ProductCandidate>): number {
  return (
    b.score - a.score ||
    Number(b.item.featured) - Number(a.item.featured) ||
    (b.item.rating ?? -1) - (a.item.rating ?? -1) ||
    b.item.reviewCount - a.item.reviewCount ||
    b.item.stock - a.item.stock ||
    a.item.name.localeCompare(b.item.name, "ro") ||
    a.item.id.localeCompare(b.item.id)
  );
}

/**
 * Ranks products. Excluded: inactive, out of stock, explicitly excluded,
 * already purchased, and anything without a positive match on the
 * customer's choices. Ties: featured → rating → review count → stock → name.
 */
export function rankProducts(
  criteria: Criteria,
  candidates: ProductCandidate[],
  weights: EngineWeights,
  options: { limit?: number } = {},
): Array<Ranked<ProductCandidate>> {
  const signals = mergeSignals(criteria.signals);
  const exclude = new Set([
    ...(criteria.excludeIds ?? []),
    ...(criteria.context?.purchasedIds ?? []),
  ]);
  const ctx = criteria.context;

  const ranked: Array<Ranked<ProductCandidate>> = [];
  for (const product of candidates) {
    if (!product.active || product.stock <= 0 || exclude.has(product.id)) continue;
    const contributions = scoreProfile(product, signals, weights);
    if (!contributions.some((c) => c.points > 0)) continue;

    if (ctx?.wishlistIds?.includes(product.id)) {
      contributions.push({
        label: "produsele tale favorite",
        points: weights.wishlistAffinity,
        source: "context",
      });
    }
    if (ctx?.routineProductIds?.includes(product.id)) {
      contributions.push({
        label: "rutinele tale salvate",
        points: weights.routineAffinity,
        source: "context",
      });
    }
    if (ctx?.viewedIds?.includes(product.id)) {
      contributions.push({
        label: "produsele pe care le-ai privit",
        points: weights.viewedAffinity,
        source: "context",
      });
    }
    if (criteria.maxPrice != null && product.price > criteria.maxPrice) {
      contributions.push({
        label: criteria.budgetLabel ?? "buget",
        points: -weights.budgetPenalty,
        source: "budget",
      });
    }

    const score = round(contributions.reduce((sum, c) => sum + c.points, 0));
    if (score <= 0) continue;
    ranked.push({ item: product, score, contributions, explanation: explain(contributions) });
  }

  ranked.sort(compareProducts);
  return options.limit != null ? ranked.slice(0, options.limit) : ranked;
}

/**
 * Generic ranking for non-product items (routines, articles): same scoring,
 * no stock/price rules. Ties break on `title`, then id.
 */
export function rankProfiles<T extends Profile & { id: string; title: string }>(
  criteria: Criteria,
  items: T[],
  weights: EngineWeights,
  options: { limit?: number } = {},
): Array<Ranked<T>> {
  const signals = mergeSignals(criteria.signals);
  const ranked = items
    .map((item) => {
      const contributions = scoreProfile(item, signals, weights);
      const score = round(contributions.reduce((s, c) => s + c.points, 0));
      return { item, score, contributions, explanation: explain(contributions) };
    })
    .filter((r) => r.score > 0 && r.contributions.some((c) => c.points > 0))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.item.title.localeCompare(b.item.title, "ro") ||
        a.item.id.localeCompare(b.item.id),
    );
  return options.limit != null ? ranked.slice(0, options.limit) : ranked;
}

// ── Building criteria ───────────────────────────────────────────────────────

export type AnswerConfig = {
  id: string;
  text: string;
  maxPrice: number | null;
  needs: Array<{ key: string; label: string; weight: number }>;
  aromas: Array<{ key: string; label: string; weight: number }>;
  tags: Array<{ key: string; label: string; weight: number }>;
  productTypes: Array<{ type: ProductType; label: string; weight: number }>;
};

/** Quiz answers → criteria. The tightest budget wins. */
export function criteriaFromAnswers(answers: AnswerConfig[]): Criteria {
  const signals: Signal[] = [];
  let maxPrice: number | null = null;
  let budgetLabel: string | null = null;
  for (const a of answers) {
    signals.push(
      ...a.needs.map((n) => ({
        kind: "need" as const,
        key: n.key,
        label: n.label,
        weight: n.weight,
      })),
      ...a.aromas.map((n) => ({
        kind: "aroma" as const,
        key: n.key,
        label: n.label,
        weight: n.weight,
      })),
      ...a.tags.map((n) => ({
        kind: "tag" as const,
        key: n.key,
        label: n.label,
        weight: n.weight,
      })),
      ...a.productTypes.map((n) => ({
        kind: "productType" as const,
        key: n.type,
        label: n.label,
        weight: n.weight,
      })),
    );
    if (a.maxPrice != null && (maxPrice == null || a.maxPrice < maxPrice)) {
      maxPrice = a.maxPrice;
      budgetLabel = a.text;
    }
  }
  return { signals: mergeSignals(signals), maxPrice, budgetLabel };
}

/** Selected needs (e.g. /descopera/[nevoie]) → criteria. */
export function criteriaFromNeeds(
  needs: Array<{ key: string; label: string }>,
  weight: number,
): Criteria {
  return { signals: needs.map((n) => ({ kind: "need", key: n.key, label: n.label, weight })) };
}

/**
 * The taxonomy of products someone likes (e.g. their favourites) → criteria,
 * with lower weights than explicit choices. Only used with personalisation consent.
 */
export function criteriaFromProfiles(
  profiles: Array<
    Profile & { needLabels: Record<string, string>; aromaLabels: Record<string, string> }
  >,
): Criteria {
  const signals: Signal[] = [];
  for (const p of profiles) {
    for (const n of p.needs)
      signals.push({ kind: "need", key: n.key, label: p.needLabels[n.key] ?? n.key, weight: 1 });
    for (const a of p.aromas)
      signals.push({ kind: "aroma", key: a.key, label: p.aromaLabels[a.key] ?? a.key, weight: 1 });
  }
  return { signals: mergeSignals(signals) };
}
