/**
 * Guard for the content rule "no medical or therapeutic claims" — pure and
 * unit-tested. It catches the usual wording in Romanian; it does not replace
 * an editorial review.
 */
import { normalizeForSearch } from "./text";

const PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /\b(trateaza|tratare|tratament|tratamentul)\b/, label: "tratează / tratament" },
  { re: /\b(vindeca|vindecare|vindecator|vindecatoare)\b/, label: "vindecă" },
  { re: /\b(previne|prevenire|preventie)\b/, label: "previne" },
  { re: /\b(amelioreaza|ameliorare|calmeaza durerea|elimina durerea)\b/, label: "ameliorează" },
  {
    re: /\b(insomnie|anxietate|depresie|migrena|migrene|durere de cap|dureri)\b/,
    label: "afecțiuni",
  },
  {
    re: /\b(antibacterian|antiviral|antiinflamator|antiseptic|antifungic)\b/,
    label: "efecte terapeutice",
  },
  { re: /\b(imunitate|sistemul imunitar|detoxifiaza|detox)\b/, label: "efecte asupra sănătății" },
  { re: /\b(boala|boli|simptom|simptome|afectiune|afectiuni)\b/, label: "boli / simptome" },
];

/** Returns the kinds of claims found (empty when the text is fine). */
export function findMedicalClaims(text: string | null | undefined): string[] {
  if (!text) return [];
  const normalized = normalizeForSearch(text);
  return [...new Set(PATTERNS.filter((p) => p.re.test(normalized)).map((p) => p.label))];
}

export const MEDICAL_CLAIMS_MESSAGE =
  "Textul pare să conțină afirmații medicale sau terapeutice. Descrie aroma, atmosfera și ritualul, nu efecte asupra sănătății.";
