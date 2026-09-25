/** CSV helpers — pure and unit-tested. */

/**
 * One CSV cell. Values that spreadsheet apps would run as formulas
 * (=, +, -, @, tab, CR) are prefixed with an apostrophe (CSV injection).
 */
export function csvCell(value: string | null | undefined): string {
  let text = value ?? "";
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV with a BOM (so spreadsheet apps read diacritics) and CRLF line endings. */
export function toCsv(header: string[], rows: Array<Array<string | null | undefined>>): string {
  return `﻿${[header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
