import "server-only";

import { buildIndex, groupHits, search, type SearchGroup, type SearchIndex } from "./engine";
import { categorySource } from "./sources/categories";
import { productSource } from "./sources/products";
import { tagSource } from "./sources/tags";
import type { SearchSource } from "./sources/types";

/** Registered sources, in display order. Add new sources here. */
export const searchSources: SearchSource[] = [categorySource, productSource, tagSource];

const TTL_MS = 60_000;
let cached: { index: SearchIndex; at: number } | null = null;
let building: Promise<SearchIndex> | null = null;

/** In-memory index, rebuilt at most once a minute (catalogue edits appear within 60 s). */
export async function getSearchIndex(): Promise<SearchIndex> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.index;
  building ??= Promise.all(searchSources.map((s) => s.load()))
    .then((results) => {
      const index = buildIndex(results.flat());
      cached = { index, at: Date.now() };
      return index;
    })
    .finally(() => {
      building = null;
    });
  return building;
}

export async function searchSite(query: string, limitPerGroup: number): Promise<SearchGroup[]> {
  const index = await getSearchIndex();
  return groupHits(search(index, query), searchSources, limitPerGroup);
}
