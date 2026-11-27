import * as SQLite from 'expo-sqlite';

import { isMeterKind, type Meter } from '@/lib/meters';

import { DEFAULT_SETTINGS, type Repo, type Settings, type StoredReading } from './types';

const SCHEMA_VERSION = 1;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS meters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        kind TEXT NOT NULL,
        unit TEXT NOT NULL,
        price_per_unit REAL
      );
      CREATE TABLE IF NOT EXISTS readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meter_id INTEGER NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        value REAL NOT NULL,
        reset INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS readings_meter_date ON readings(meter_id, date);
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
    `);
  }
  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('meterlog.db').then(async (db) => {
      await migrate(db);
      return db;
    });
  }
  return dbPromise;
}

interface MeterRow {
  id: number;
  name: string;
  kind: string;
  unit: string;
  price_per_unit: number | null;
}

interface ReadingRow {
  id: number;
  meter_id: number;
  date: string;
  value: number;
  reset: number;
}

export const repo: Repo = {
  persistent: true,

  async load() {
    const db = await getDb();
    const meterRows = await db.getAllAsync<MeterRow>('SELECT * FROM meters ORDER BY name COLLATE NOCASE, id');
    const readingRows = await db.getAllAsync<ReadingRow>('SELECT * FROM readings ORDER BY date, id');
    const settingRow = await db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'app'");
    const meters: Meter[] = meterRows.map((m) => ({
      id: m.id,
      name: m.name,
      kind: isMeterKind(m.kind) ? m.kind : 'custom',
      unit: m.unit,
      pricePerUnit: m.price_per_unit,
    }));
    const readings: StoredReading[] = readingRows.map((r) => ({
      id: r.id,
      meterId: r.meter_id,
      date: r.date,
      value: r.value,
      reset: r.reset === 1,
    }));
    let settings: Settings = DEFAULT_SETTINGS;
    if (settingRow) {
      try {
        settings = { ...DEFAULT_SETTINGS, ...(JSON.parse(settingRow.value) as Partial<Settings>) };
      } catch {
        settings = DEFAULT_SETTINGS;
      }
    }
    return { meters, readings, settings };
  },

  async addMeter(input) {
    const db = await getDb();
    const res = await db.runAsync(
      'INSERT INTO meters (name, kind, unit, price_per_unit) VALUES (?, ?, ?, ?)',
      input.name,
      input.kind,
      input.unit,
      input.pricePerUnit,
    );
    return res.lastInsertRowId;
  },

  async updateMeter(id, input) {
    const db = await getDb();
    await db.runAsync(
      'UPDATE meters SET name = ?, kind = ?, unit = ?, price_per_unit = ? WHERE id = ?',
      input.name,
      input.kind,
      input.unit,
      input.pricePerUnit,
      id,
    );
  },

  async deleteMeter(id) {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM readings WHERE meter_id = ?', id);
      await db.runAsync('DELETE FROM meters WHERE id = ?', id);
    });
  },

  async addReading(input) {
    const db = await getDb();
    const res = await db.runAsync(
      'INSERT INTO readings (meter_id, date, value, reset) VALUES (?, ?, ?, ?)',
      input.meterId,
      input.date,
      input.value,
      input.reset ? 1 : 0,
    );
    return res.lastInsertRowId;
  },

  async updateReading(id, input) {
    const db = await getDb();
    await db.runAsync(
      'UPDATE readings SET date = ?, value = ?, reset = ? WHERE id = ?',
      input.date,
      input.value,
      input.reset ? 1 : 0,
      id,
    );
  },

  async deleteReading(id) {
    const db = await getDb();
    await db.runAsync('DELETE FROM readings WHERE id = ?', id);
  },

  async saveSettings(settings) {
    const db = await getDb();
    await db.runAsync(
      "INSERT INTO settings (key, value) VALUES ('app', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      JSON.stringify(settings),
    );
  },
};
