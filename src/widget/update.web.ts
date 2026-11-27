import type { Snapshot } from '@/data/types';

export const widgetsAvailable = false;

export function updateWidgets(_snapshot: Pick<Snapshot, 'meters' | 'readings'>): void {}

export async function pinWidget(): Promise<boolean> {
  return false;
}
