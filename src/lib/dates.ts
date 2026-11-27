/** Dates are stored as ISO calendar days: "YYYY-MM-DD" (no time, no time zone). */
export type IsoDay = string;

const MS_PER_DAY = 86_400_000;
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Number of days since 1970-01-01 for a calendar day, or NaN if invalid. */
export function toDayNumber(day: IsoDay): number {
  const m = ISO_RE.exec(day);
  if (!m) return NaN;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const ms = Date.UTC(y, mo - 1, d);
  const check = new Date(ms);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) {
    return NaN;
  }
  return ms / MS_PER_DAY;
}

export function isValidDay(day: string): boolean {
  return !Number.isNaN(toDayNumber(day));
}

export function fromDayNumber(n: number): IsoDay {
  const dt = new Date(n * MS_PER_DAY);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysBetween(from: IsoDay, to: IsoDay): number {
  return toDayNumber(to) - toDayNumber(from);
}

export function addDays(day: IsoDay, n: number): IsoDay {
  return fromDayNumber(toDayNumber(day) + n);
}

/** Local calendar day of a JS Date (what the user sees on the phone). */
export function dayFromDate(date: Date): IsoDay {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** JS Date at local noon for a calendar day (safe for date pickers). */
export function dateFromDay(day: IsoDay): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/** "YYYY-MM" */
export type MonthKey = string;

export function monthOf(day: IsoDay): MonthKey {
  return day.slice(0, 7);
}

export function firstDayOfMonth(month: MonthKey): IsoDay {
  return `${month}-01`;
}

export function daysInMonth(month: MonthKey): number {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function nextMonth(month: MonthKey): MonthKey {
  const [y, m] = month.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
}

export function addMonths(month: MonthKey, n: number): MonthKey {
  const [y, m] = month.split('-').map(Number);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = total - ny * 12 + 1;
  return `${ny}-${String(nm).padStart(2, '0')}`;
}
