import {
  addMonths,
  daysBetween,
  daysInMonth,
  firstDayOfMonth,
  isValidDay,
  type IsoDay,
  type MonthKey,
  monthOf,
  nextMonth,
  toDayNumber,
} from './dates';

export interface Reading {
  id: number;
  date: IsoDay;
  value: number;
  /**
   * The meter was replaced or reset before this reading: it starts a new series.
   * Consumption between the previous reading and this one is unknown.
   */
  reset: boolean;
}

/** Consumption measured between two consecutive readings of the same series. */
export interface Interval {
  start: IsoDay;
  end: IsoDay;
  days: number;
  amount: number;
  /** id of the reading that closes the interval */
  readingId: number;
}

export function sortReadings<T extends Reading>(readings: readonly T[]): T[] {
  return [...readings].sort((a, b) => (a.date === b.date ? a.id - b.id : a.date < b.date ? -1 : 1));
}

/**
 * Intervals between consecutive readings. A reading flagged `reset` starts a new
 * series, so no interval ends on it. Readings on the same day give no interval.
 */
export function intervals(readings: readonly Reading[]): Interval[] {
  const sorted = sortReadings(readings);
  const out: Interval[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (cur.reset) continue;
    const days = daysBetween(prev.date, cur.date);
    if (days <= 0) continue;
    out.push({ start: prev.date, end: cur.date, days, amount: cur.value - prev.value, readingId: cur.id });
  }
  return out;
}

/** Map reading id -> consumption since the previous reading (null for the first of a series). */
export function consumptionByReading(readings: readonly Reading[]): Map<number, Interval> {
  const map = new Map<number, Interval>();
  for (const iv of intervals(readings)) map.set(iv.readingId, iv);
  return map;
}

/** Average consumption per day over all intervals (weighted by their length). */
export function dailyAverage(ivs: readonly Interval[]): number | null {
  let amount = 0;
  let days = 0;
  for (const iv of ivs) {
    amount += iv.amount;
    days += iv.days;
  }
  return days > 0 ? amount / days : null;
}

/**
 * Average per day over the last `windowDays` days covered by readings
 * (intervals are cut at the window start, proportionally). Falls back to null
 * when there is no data.
 */
export function recentDailyAverage(ivs: readonly Interval[], windowDays = 90): number | null {
  if (ivs.length === 0) return null;
  const lastEnd = Math.max(...ivs.map((iv) => toDayNumber(iv.end)));
  const windowStart = lastEnd - windowDays;
  let amount = 0;
  let days = 0;
  for (const iv of ivs) {
    const s = toDayNumber(iv.start);
    const e = toDayNumber(iv.end);
    const from = Math.max(s, windowStart);
    if (e <= from) continue;
    const covered = e - from;
    amount += (iv.amount * covered) / iv.days;
    days += covered;
  }
  return days > 0 ? amount / days : null;
}

export interface MonthTotal {
  month: MonthKey;
  /** consumption attributed to the month (intervals spread evenly over their days) */
  amount: number;
  /** number of days of the month covered by readings */
  coveredDays: number;
  daysInMonth: number;
}

/**
 * Spread each interval evenly over its days and add up per calendar month
 * (linear interpolation of the meter value at month boundaries).
 * A day D belongs to the interval [start, end) when start <= D < end.
 */
export function monthlyTotals(ivs: readonly Interval[]): MonthTotal[] {
  const byMonth = new Map<MonthKey, { amount: number; covered: number }>();
  for (const iv of ivs) {
    const perDay = iv.amount / iv.days;
    const startN = toDayNumber(iv.start);
    const endN = toDayNumber(iv.end);
    let month = monthOf(iv.start);
    while (true) {
      const mStart = toDayNumber(firstDayOfMonth(month));
      const mEnd = toDayNumber(firstDayOfMonth(nextMonth(month)));
      if (mStart >= endN) break;
      const from = Math.max(startN, mStart);
      const to = Math.min(endN, mEnd);
      if (to > from) {
        const acc = byMonth.get(month) ?? { amount: 0, covered: 0 };
        acc.amount += perDay * (to - from);
        acc.covered += to - from;
        byMonth.set(month, acc);
      }
      month = nextMonth(month);
    }
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, v]) => ({
      month,
      amount: v.amount,
      coveredDays: v.covered,
      daysInMonth: daysInMonth(month),
    }));
}

/** The last `count` months ending with `lastMonth`, filled with zeros where there is no data. */
export function lastMonths(totals: readonly MonthTotal[], lastMonth: MonthKey, count: number): MonthTotal[] {
  const byMonth = new Map(totals.map((t) => [t.month, t]));
  const out: MonthTotal[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const month = addMonths(lastMonth, -i);
    out.push(byMonth.get(month) ?? { month, amount: 0, coveredDays: 0, daysInMonth: daysInMonth(month) });
  }
  return out;
}

export interface MonthEstimate {
  month: MonthKey;
  /** consumption measured by readings inside the month */
  measured: number;
  measuredDays: number;
  /** measured + recent daily average for the days not covered yet */
  estimated: number;
}

/**
 * Estimate for the month containing `today`: what readings already measured,
 * plus the recent daily average for the remaining days of the month.
 */
export function currentMonthEstimate(readings: readonly Reading[], today: IsoDay): MonthEstimate | null {
  const ivs = intervals(readings);
  const avg = recentDailyAverage(ivs);
  if (avg === null) return null;
  const month = monthOf(today);
  const total = monthlyTotals(ivs).find((t) => t.month === month);
  const measured = total?.amount ?? 0;
  const measuredDays = total?.coveredDays ?? 0;
  const missing = Math.max(0, daysInMonth(month) - measuredDays);
  return { month, measured, measuredDays, estimated: measured + avg * missing };
}

/** Projection for the next `days` days from the recent daily average. */
export function projection(readings: readonly Reading[], days = 30): number | null {
  const avg = recentDailyAverage(intervals(readings));
  return avg === null ? null : avg * days;
}

export function cost(amount: number | null, pricePerUnit: number | null): number | null {
  if (amount === null || pricePerUnit === null) return null;
  return amount * pricePerUnit;
}

export type ReadingError = 'invalidDate' | 'futureDate' | 'invalidValue' | 'sameDay' | 'belowPrevious' | 'aboveNext';

export interface ReadingCandidate {
  /** id of the reading being edited, if any */
  id?: number;
  date: IsoDay;
  value: number;
  reset: boolean;
}

/**
 * Check a new or edited reading against the others of the same meter.
 * - the value must not go below the previous reading unless the meter was reset;
 * - the next reading (unless it is itself a reset) must not end up below this one.
 */
export function validateReading(
  existing: readonly Reading[],
  candidate: ReadingCandidate,
  today: IsoDay,
): ReadingError | null {
  if (!isValidDay(candidate.date)) return 'invalidDate';
  if (candidate.date > today) return 'futureDate';
  if (!Number.isFinite(candidate.value) || candidate.value < 0) return 'invalidValue';
  const others = sortReadings(existing.filter((r) => r.id !== candidate.id));
  if (others.some((r) => r.date === candidate.date)) return 'sameDay';
  const prev = [...others].reverse().find((r) => r.date < candidate.date);
  const next = others.find((r) => r.date > candidate.date);
  if (prev && !candidate.reset && candidate.value < prev.value) return 'belowPrevious';
  if (next && !next.reset && next.value < candidate.value) return 'aboveNext';
  return null;
}
