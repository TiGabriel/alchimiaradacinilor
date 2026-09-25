import { normalizeForSearch } from "./text";

/** ASCII slug with Romanian transliteration: "Uleiuri individuale – Îngrijire" → "uleiuri-individuale-ingrijire". */
export function slugify(input: string): string {
  return normalizeForSearch(input).replace(/ /g, "-");
}
