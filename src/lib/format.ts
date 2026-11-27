/**
 * Parse a number typed by the user: accepts "1234.5", "1234,5", "1 234,5",
 * "1,234.5" and "1.234,5". Returns NaN when it is not a number.
 */
export function parseDecimal(input: string): number {
  let s = input.trim().replace(/[\s  ']/g, '');
  if (s === '') return NaN;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma >= 0 && lastDot >= 0) {
    // the last separator is the decimal one, the other is for thousands
    if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (lastComma >= 0) {
    if ((s.match(/,/g) ?? []).length > 1) return NaN;
    s = s.replace(',', '.');
  }
  if (!/^-?\d*\.?\d+$|^-?\d+\.$/.test(s)) return NaN;
  return Number(s);
}

/** Decimals that keep a value readable: more for small numbers. */
export function smartDecimals(value: number): number {
  const a = Math.abs(value);
  if (a === 0) return 0;
  if (a < 10) return 2;
  if (a < 100) return 1;
  return 0;
}

export function formatNumber(value: number, locale: string, decimals?: number): string {
  const d = decimals ?? smartDecimals(value);
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 0, maximumFractionDigits: d }).format(value);
}

export function formatMoney(value: number, locale: string, currency: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
  } catch {
    return `${formatNumber(value, locale, 2)} ${currency}`;
  }
}

/** "12 Mar 2026" / "12 mars 2026" */
export function formatDay(day: string, locale: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

/** "March 2026" / "mars 2026" */
export function formatMonth(month: string, locale: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, 15)));
}
