import type { Reading } from '@/lib/consumption';
import type { Meter, MeterKind } from '@/lib/meters';

export interface StoredReading extends Reading {
  meterId: number;
}

export interface MeterInput {
  name: string;
  kind: MeterKind;
  unit: string;
  pricePerUnit: number | null;
}

export interface ReadingInput {
  meterId: number;
  date: string;
  value: number;
  reset: boolean;
}

export interface Settings {
  reminderEnabled: boolean;
  reminderDay: number;
  reminderId: string | null;
}

export const DEFAULT_SETTINGS: Settings = { reminderEnabled: false, reminderDay: 1, reminderId: null };

export interface Snapshot {
  meters: Meter[];
  readings: StoredReading[];
  settings: Settings;
}

/** Storage used by the app: SQLite on the phone, memory on the web preview. */
export interface Repo {
  readonly persistent: boolean;
  load(): Promise<Snapshot>;
  addMeter(input: MeterInput): Promise<number>;
  updateMeter(id: number, input: MeterInput): Promise<void>;
  deleteMeter(id: number): Promise<void>;
  addReading(input: ReadingInput): Promise<number>;
  updateReading(id: number, input: ReadingInput): Promise<void>;
  deleteReading(id: number): Promise<void>;
  saveSettings(settings: Settings): Promise<void>;
}
