/**
 * Money is handled as integer minor units (bani; 100 bani = 1 RON) everywhere.
 * Only formatting converts to a decimal representation.
 */

export const DEFAULT_CURRENCY = "RON";

const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: string) {
  let f = formatters.get(currency);
  if (!f) {
    f = new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    formatters.set(currency, f);
  }
  return f;
}

/** 4999 → "49,99 RON" (ro-RO formatting; the non-breaking space is preserved). */
export function formatMoney(minor: number, currency: string = DEFAULT_CURRENCY): string {
  if (!Number.isInteger(minor))
    throw new TypeError(`Money must be an integer amount of minor units, got ${minor}`);
  return formatterFor(currency).format(minor / 100);
}

/** Converts a decimal major-unit amount ("49.99" or 49.99) to minor units, rounding half away from zero. */
export function toMinor(major: number | string): number {
  const value = typeof major === "string" ? Number(major.replace(",", ".")) : major;
  if (!Number.isFinite(value)) throw new TypeError(`Invalid money amount: ${major}`);
  // Shift the decimal point via exponent notation: 1.005 * 100 is 100.4999… in
  // binary floating point, while Number("1.005e2") is exactly 100.5.
  // Values already in exponent form (e.g. 1e-7) fall back to multiplication.
  const abs = Math.abs(value);
  const shifted = Number(`${abs}e2`);
  return Math.sign(value) * Math.round(Number.isNaN(shifted) ? abs * 100 : shifted);
}

/**
 * Percentage of `value`, in minor units, rounded half away from zero.
 * Used for percentage discounts: percentOf(4999, 10) → 500.
 */
export function percentOf(minor: number, percent: number): number {
  return Math.sign(minor) * Math.round((Math.abs(minor) * percent) / 100);
}
