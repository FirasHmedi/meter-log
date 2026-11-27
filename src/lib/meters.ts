export type MeterKind = 'electricity' | 'water' | 'gas' | 'custom';

export const METER_KINDS: readonly MeterKind[] = ['electricity', 'water', 'gas', 'custom'];

export interface Meter {
  id: number;
  name: string;
  kind: MeterKind;
  unit: string;
  /** price per unit in the phone's currency, or null when unknown */
  pricePerUnit: number | null;
}

export function defaultUnit(kind: MeterKind): string {
  switch (kind) {
    case 'electricity':
      return 'kWh';
    case 'water':
    case 'gas':
      return 'm³';
    case 'custom':
      return '';
  }
}

/** Unit to store for a meter: fixed for the known kinds, typed by the user for a custom one. */
export function resolveUnit(kind: MeterKind, customUnit: string): string {
  return kind === 'custom' ? customUnit.trim() : defaultUnit(kind);
}

export function isMeterKind(v: unknown): v is MeterKind {
  return typeof v === 'string' && (METER_KINDS as readonly string[]).includes(v);
}
