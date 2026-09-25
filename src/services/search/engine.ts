/**
 * Site search engine — pure, in-memory, Romanian-aware (tested).
 *
 * - Diacritics are folded on both sides ("lavanda" ≈ "lavandă").
 * - Synonyms are expanded at index time, so multi-word pairs work
 *   ("arbore de ceai" ↔ "tea tree").
 * - Every meaningful query token must match (AND); matches score by kind
 *   (exact > prefix > substring > typo) and by field (title > synonym > keyword).
 *
 * Sources (products, categories, tags, later articles/routines) produce
 * SearchDocuments; the engine does not know about any of them.
 */
import { normalizeForSearch, tokenize } from "@/lib/text";

export type SearchDocument = {
  id: string;
  /** Source type, e.g. "product" | "category" | "tag". Open for new sources. */
  type: string;
  title: string;
  subtitle?: string;
  href: string;
  /** Extra searchable text (brand, category, needs, aromas…). */
  keywords?: string[];
  /** Multiplies the score (default 1). */
  boost?: number;
  /** Opaque payload for the UI (price, image…). */
  meta?: Record<string, unknown>;
};

type IndexedDocument = {
  doc: SearchDocument;
  titleNorm: string;
  title: string[];
  synonyms: string[];
  keywords: string[];
};

export type SearchIndex = { docs: IndexedDocument[] };

export type SearchHit = { doc: SearchDocument; score: number };

/** Groups of equivalent phrases (Romanian ↔ English product names and common variants). */
export const DEFAULT_SYNONYMS: string[][] = [
  ["lavanda", "lavender", "levantica"],
  ["lamaie", "lemon", "lamai"],
  ["menta", "peppermint", "menta piperata", "mint"],
  ["portocala", "orange", "wild orange", "portocala salbatica", "portocale"],
  ["arbore de ceai", "tea tree", "tea-tree"],
  ["difuzor", "difuzoare", "diffuser", "difuzer"],
  ["ulei esential", "uleiuri esentiale", "essential oil"],
  ["amestec", "amestecuri", "blend"],
  ["kit", "kituri", "kit-uri", "set", "seturi"],
  ["accesoriu", "accesorii", "accessory"],
  ["citrice", "citric", "citrus"],
  ["relaxare", "relaxant", "calm", "liniste"],
  ["cadou", "cadouri", "gift"],
];

const STOPWORDS = new Set([
  "de",
  "si",
  "cu",
  "pt",
  "pentru",
  "la",
  "in",
  "din",
  "a",
  "al",
  "ale",
  "un",
  "o",
  "the",
]);

const SCORE = { exact: 10, prefix: 7, substring: 4, typo: 3 } as const;
const FIELD = { title: 3, synonyms: 2, keywords: 1 } as const;

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost);
    }
    prev = curr;
  }
  return prev[b.length]!;
}

function tokenScore(query: string, token: string): number {
  if (token === query) return SCORE.exact;
  if (query.length >= 2 && token.startsWith(query)) return SCORE.prefix;
  if (query.length >= 3 && token.includes(query)) return SCORE.substring;
  if (query.length >= 4) {
    const allowed = query.length >= 7 ? 2 : 1;
    // Compare against the token and its same-length prefix (typos while still typing).
    const distance = Math.min(
      levenshtein(query, token),
      levenshtein(query, token.slice(0, query.length)),
    );
    if (distance <= allowed) return SCORE.typo;
  }
  return 0;
}

function bestIn(query: string, tokens: string[]): number {
  let best = 0;
  for (const token of tokens) {
    const score = tokenScore(query, token);
    if (score > best) best = score;
    if (best === SCORE.exact) break;
  }
  return best;
}

/** Whole-word phrase containment on normalised text. */
function containsPhrase(text: string, phrase: string) {
  return ` ${text} `.includes(` ${phrase} `);
}

export function buildIndex(
  documents: SearchDocument[],
  synonyms: string[][] = DEFAULT_SYNONYMS,
): SearchIndex {
  const groups = synonyms.map((group) => group.map(normalizeForSearch));
  return {
    docs: documents.map((doc) => {
      const titleNorm = normalizeForSearch(doc.title);
      const keywordText = normalizeForSearch((doc.keywords ?? []).join(" "));
      const haystack = `${titleNorm} ${keywordText}`;
      const synonymTokens = new Set<string>();
      for (const group of groups) {
        if (group.some((phrase) => containsPhrase(haystack, phrase))) {
          for (const phrase of group) for (const t of phrase.split(" ")) synonymTokens.add(t);
        }
      }
      return {
        doc,
        titleNorm,
        title: tokenize(doc.title),
        synonyms: [...synonymTokens],
        keywords: keywordText ? keywordText.split(" ") : [],
      };
    }),
  };
}

export function queryTokens(query: string): string[] {
  const tokens = tokenize(query);
  const meaningful = tokens.filter((t) => !STOPWORDS.has(t));
  return meaningful.length ? meaningful : tokens;
}

export function search(
  index: SearchIndex,
  query: string,
  options: { types?: string[] } = {},
): SearchHit[] {
  const tokens = queryTokens(query);
  if (tokens.length === 0) return [];
  const normalizedQuery = normalizeForSearch(query);

  const hits: SearchHit[] = [];
  for (const entry of index.docs) {
    if (options.types && !options.types.includes(entry.doc.type)) continue;
    let score = 0;
    let matchedAll = true;
    for (const token of tokens) {
      const fieldScores = [
        bestIn(token, entry.title) * FIELD.title,
        bestIn(token, entry.synonyms) * FIELD.synonyms,
        bestIn(token, entry.keywords) * FIELD.keywords,
      ];
      const best = Math.max(...fieldScores);
      if (best === 0) {
        matchedAll = false;
        break;
      }
      // Matching in several fields (e.g. category *and* aroma) ranks a little higher.
      const sum = fieldScores.reduce((a, b) => a + b, 0);
      score += best + (sum - best) * 0.25;
    }
    if (!matchedAll) continue;
    if (entry.titleNorm === normalizedQuery) score += 30;
    else if (entry.titleNorm.startsWith(normalizedQuery)) score += 15;
    hits.push({ doc: entry.doc, score: score * (entry.doc.boost ?? 1) });
  }

  return hits.sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title, "ro"));
}

export type SearchGroup = { type: string; label: string; hits: SearchHit[]; total: number };

/** Groups hits by source type in the given order, capping each group. */
export function groupHits(
  hits: SearchHit[],
  groups: Array<{ type: string; label: string }>,
  limitPerGroup: number,
): SearchGroup[] {
  return groups
    .map(({ type, label }) => {
      const ofType = hits.filter((h) => h.doc.type === type);
      return { type, label, hits: ofType.slice(0, limitPerGroup), total: ofType.length };
    })
    .filter((g) => g.total > 0);
}
