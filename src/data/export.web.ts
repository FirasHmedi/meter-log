import { readingsToCsv } from '@/lib/csv';
import type { Reading } from '@/lib/consumption';

/** Web preview: downloads the CSV file. */
export async function shareReadingsCsv(meterName: string, unit: string, readings: readonly Reading[]): Promise<boolean> {
  const blob = new Blob([readingsToCsv(meterName, unit, readings)], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${meterName}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}
