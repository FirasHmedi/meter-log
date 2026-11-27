import type { Snapshot } from '@/data/types';
import { dayFromDate } from '@/lib/dates';
import { selectWidgetRows } from '@/lib/widget';

import { LogReadingWidget } from './LogReadingWidget';

export function renderLogReading(snapshot: Pick<Snapshot, 'meters' | 'readings'>) {
  const rows = selectWidgetRows(snapshot.meters, snapshot.readings, dayFromDate(new Date()));
  return {
    light: <LogReadingWidget rows={rows} theme="light" />,
    dark: <LogReadingWidget rows={rows} theme="dark" />,
  };
}
