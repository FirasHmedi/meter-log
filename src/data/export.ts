import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { readingsToCsv } from '@/lib/csv';
import type { Reading } from '@/lib/consumption';

/** Writes the CSV in the cache folder and opens the share sheet. Returns false if sharing is unavailable. */
export async function shareReadingsCsv(meterName: string, unit: string, readings: readonly Reading[]): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) return false;
  const safe = meterName.replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '') || 'meter';
  const file = new File(Paths.cache, `${safe}.csv`);
  if (file.exists) file.delete();
  file.create();
  await file.write(readingsToCsv(meterName, unit, readings));
  await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: meterName, UTI: 'public.comma-separated-values-text' });
  return true;
}
