import { sortReadings, type Reading } from './consumption';
import { daysBetween, type IsoDay } from './dates';

export interface WidgetMeterInput {
  id: number;
  name: string;
  unit: string;
}

export interface WidgetRow {
  meterId: number;
  name: string;
  unit: string;
  /** Last reading, or null when the meter has none yet. */
  last: { value: number; date: IsoDay; daysSince: number } | null;
}

/**
 * Meters shown on the "Log a reading" widget: the ones that need a reading most come first
 * (no reading yet, then the oldest last reading). Ties keep the order of the app's list.
 */
export function selectWidgetRows(
  meters: readonly WidgetMeterInput[],
  readings: readonly (Reading & { meterId: number })[],
  today: IsoDay,
  max = 2,
): WidgetRow[] {
  const rows = meters.map((m, index) => {
    const last = sortReadings(readings.filter((r) => r.meterId === m.id)).pop();
    const row: WidgetRow = {
      meterId: m.id,
      name: m.name,
      unit: m.unit,
      last: last ? { value: last.value, date: last.date, daysSince: Math.max(0, daysBetween(last.date, today)) } : null,
    };
    return { row, index };
  });
  const urgency = (r: WidgetRow) => (r.last === null ? Number.POSITIVE_INFINITY : r.last.daysSince);
  rows.sort((a, b) => urgency(b.row) - urgency(a.row) || a.index - b.index);
  return rows.slice(0, Math.max(0, max)).map((r) => r.row);
}

/** Deep link that opens the add-reading screen for one meter. */
export function addReadingLink(meterId: number): string {
  return `meterlog://reading?meterId=${meterId}`;
}

/** Key of the "days since" label: today, yesterday, or a number of days. */
export function daysSinceLabel(days: number): { key: 'today' | 'yesterday' | 'days'; days: number } {
  if (days <= 0) return { key: 'today', days: 0 };
  if (days === 1) return { key: 'yesterday', days: 1 };
  return { key: 'days', days };
}
