/** Article content helpers — pure and tested. */

export type ContentBlock =
  | { type: "markdown"; text: string }
  | { type: "product"; slug: string }
  | { type: "routine"; slug: string };

const EMBED = /^\{\{(produs|rutina):([a-z0-9-]{1,80})\}\}$/;

/**
 * Splits Markdown into prose and embedded cards. An embed is a line of its
 * own: {{produs:slug}} or {{rutina:slug}}. Everything else stays Markdown
 * (rendered without raw HTML).
 */
export function parseArticleContent(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let buffer: string[] = [];
  const flush = () => {
    const text = buffer.join("\n").trim();
    if (text) blocks.push({ type: "markdown", text });
    buffer = [];
  };
  for (const line of content.replace(/\r\n/g, "\n").split("\n")) {
    const match = EMBED.exec(line.trim());
    if (match) {
      flush();
      blocks.push({ type: match[1] === "produs" ? "product" : "routine", slug: match[2]! });
    } else {
      buffer.push(line);
    }
  }
  flush();
  return blocks;
}

export function embeddedSlugs(blocks: ContentBlock[]) {
  return {
    products: [...new Set(blocks.flatMap((b) => (b.type === "product" ? [b.slug] : [])))],
    routines: [...new Set(blocks.flatMap((b) => (b.type === "routine" ? [b.slug] : [])))],
  };
}

/** Minutes to read at ~200 words per minute (at least 1). Embeds are ignored. */
export function readingTimeMinutes(content: string): number {
  const words = content
    .replace(/\{\{[^}]*\}\}/g, " ")
    .replace(/[#*_>`[\]()-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export type ArticleRelations = {
  id: string;
  categoryId: string | null;
  tagIds: string[];
  productIds: string[];
  routineIds: string[];
  publishedAt: Date;
};

/** Related articles: same category (+3), each shared routine (+2), product (+1) or tag (+1). Newest first on ties. */
export function rankRelatedArticles(
  source: ArticleRelations,
  others: ArticleRelations[],
  limit: number,
): string[] {
  const overlap = (a: string[], b: string[]) => a.filter((x) => b.includes(x)).length;
  return others
    .filter((o) => o.id !== source.id)
    .map((o) => ({
      id: o.id,
      publishedAt: o.publishedAt,
      score:
        (source.categoryId && o.categoryId === source.categoryId ? 3 : 0) +
        overlap(source.routineIds, o.routineIds) * 2 +
        overlap(source.productIds, o.productIds) +
        overlap(source.tagIds, o.tagIds),
    }))
    .filter((o) => o.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.publishedAt.getTime() - a.publishedAt.getTime() ||
        a.id.localeCompare(b.id),
    )
    .slice(0, limit)
    .map((o) => o.id);
}
