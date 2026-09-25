/**
 * Gentle "goes well with" scoring from shared taxonomy — pure and tested.
 * Used for related products (product page) and cart suggestions.
 */

export type SimilarityProfile = {
  id: string;
  tags: string[];
  needs: string[];
  aromas: string[];
  categoryId?: string;
  inStock?: boolean;
};

const WEIGHTS = { needs: 3, aromas: 2, tags: 1, sameCategory: 1 } as const;

function overlap(a: string[], b: string[]) {
  const set = new Set(a);
  return b.reduce((n, v) => n + (set.has(v) ? 1 : 0), 0);
}

export function similarityScore(a: SimilarityProfile, b: SimilarityProfile): number {
  if (a.id === b.id) return 0;
  return (
    overlap(a.needs, b.needs) * WEIGHTS.needs +
    overlap(a.aromas, b.aromas) * WEIGHTS.aromas +
    overlap(a.tags, b.tags) * WEIGHTS.tags +
    (a.categoryId && a.categoryId === b.categoryId ? WEIGHTS.sameCategory : 0)
  );
}

/**
 * Ranks candidates against one or more source profiles (scores are summed).
 * Excludes the sources and anything in `exclude`, drops zero scores and
 * out-of-stock items, and breaks ties by id for stable output.
 */
export function rankSimilar(
  sources: SimilarityProfile[],
  candidates: SimilarityProfile[],
  { limit, exclude = [] }: { limit: number; exclude?: string[] },
): string[] {
  const skip = new Set([...sources.map((s) => s.id), ...exclude]);
  return candidates
    .filter((c) => !skip.has(c.id) && c.inStock !== false)
    .map((c) => ({ id: c.id, score: sources.reduce((sum, s) => sum + similarityScore(s, c), 0) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, Math.max(0, limit))
    .map((c) => c.id);
}
