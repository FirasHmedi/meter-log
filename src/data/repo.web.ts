/**
 * Web preview only: data lives in memory and starts with generic sample data,
 * so the app can be shown in a browser (README screenshots). The phone app uses SQLite (repo.ts).
 */
import { addDays, dayFromDate } from '@/lib/dates';
import type { Meter } from '@/lib/meters';

import { DEFAULT_SETTINGS, type Repo, type Settings, type StoredReading } from './types';

let meters: Meter[] = [];
let readings: StoredReading[] = [];
let settings: Settings = { ...DEFAULT_SETTINGS };
let nextId = 1;

function seed() {
  const lang = typeof navigator !== 'undefined' && navigator.language.startsWith('fr') ? 'fr' : 'en';
  const elec = nextId++;
  const water = nextId++;
  meters = [
    { id: elec, name: lang === 'fr' ? 'Électricité maison' : 'Home electricity', kind: 'electricity', unit: 'kWh', pricePerUnit: 0.25 },
    { id: water, name: lang === 'fr' ? 'Eau' : 'Water', kind: 'water', unit: 'm³', pricePerUnit: 4.2 },
  ];
  const today = dayFromDate(new Date());
  // one reading about every 30 days over a year, more in winter for electricity
  let e = 41_250;
  let w = 812;
  for (let i = 12; i >= 0; i--) {
    const date = addDays(today, -i * 30 - 2);
    const month = Number(date.slice(5, 7));
    const winter = month <= 3 || month >= 11;
    readings.push({ id: nextId++, meterId: elec, date, value: Math.round(e), reset: false });
    readings.push({ id: nextId++, meterId: water, date, value: Math.round(w * 10) / 10, reset: false });
    e += (winter ? 14 : 8) * 30 + ((i * 7) % 5) * 6;
    w += 0.33 * 30 + ((i * 3) % 4) * 0.4;
  }
}
seed();

export const repo: Repo = {
  persistent: false,
  async load() {
    return { meters: [...meters], readings: [...readings], settings: { ...settings } };
  },
  async addMeter(input) {
    const id = nextId++;
    meters.push({ id, ...input });
    return id;
  },
  async updateMeter(id, input) {
    meters = meters.map((m) => (m.id === id ? { id, ...input } : m));
  },
  async deleteMeter(id) {
    meters = meters.filter((m) => m.id !== id);
    readings = readings.filter((r) => r.meterId !== id);
  },
  async addReading(input) {
    const id = nextId++;
    readings.push({ id, ...input });
    return id;
  },
  async updateReading(id, input) {
    readings = readings.map((r) => (r.id === id ? { id, ...input } : r));
  },
  async deleteReading(id) {
    readings = readings.filter((r) => r.id !== id);
  },
  async saveSettings(next) {
    settings = { ...next };
  },
};
