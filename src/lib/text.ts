/**
 * Text helpers for Romanian content.
 *
 * Both comma-below (ș ț — correct) and cedilla (ş ţ — legacy) forms appear in
 * real-world Romanian text, so both are folded.
 */

/** Lower-cases and strips diacritics: "Lavandă Ş" → "lavanda s". */
export function foldDiacritics(input: string): string {
  return input.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Folds diacritics and collapses everything that is not a letter/digit into single spaces. */
export function normalizeForSearch(input: string): string {
  return foldDiacritics(input)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function tokenize(input: string): string[] {
  const normalized = normalizeForSearch(input);
  return normalized ? normalized.split(" ") : [];
}
