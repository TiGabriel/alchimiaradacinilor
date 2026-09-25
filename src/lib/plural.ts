/**
 * Romanian counted nouns: "1 produs", "5 produse", "20 de produse", "101 produse".
 * Numbers ≥ 20 take "de", except when the last two digits are 01–19.
 */
export function pluralRo(count: number, one: string, many: string): string {
  if (count === 1) return `1 ${one}`;
  const lastTwo = Math.abs(count) % 100;
  const de = Math.abs(count) >= 20 && !(lastTwo >= 1 && lastTwo <= 19);
  return `${count}${de ? " de" : ""} ${many}`;
}
