import { consumptionByReading, type Reading, sortReadings } from './consumption';

function cell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * CSV export of a meter's readings (comma separated, dot decimals, one row per reading),
 * readable by any spreadsheet.
 */
export function readingsToCsv(meterName: string, unit: string, readings: readonly Reading[]): string {
  const consumption = consumptionByReading(readings);
  const lines = ['meter,unit,date,value,reset,consumption_since_previous,days_since_previous'];
  for (const r of sortReadings(readings)) {
    const iv = consumption.get(r.id);
    lines.push(
      [
        cell(meterName),
        cell(unit),
        r.date,
        String(r.value),
        r.reset ? 'yes' : 'no',
        iv ? String(Math.round(iv.amount * 1000) / 1000) : '',
        iv ? String(iv.days) : '',
      ].join(','),
    );
  }
  return lines.join('\n') + '\n';
}
