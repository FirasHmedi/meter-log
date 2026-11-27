import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { repo } from './repo';
import { DEFAULT_SETTINGS, type MeterInput, type ReadingInput, type Settings, type Snapshot } from './types';

interface Store extends Snapshot {
  ready: boolean;
  persistent: boolean;
  addMeter(input: MeterInput): Promise<number>;
  updateMeter(id: number, input: MeterInput): Promise<void>;
  deleteMeter(id: number): Promise<void>;
  addReading(input: ReadingInput): Promise<void>;
  updateReading(id: number, input: ReadingInput): Promise<void>;
  deleteReading(id: number): Promise<void>;
  saveSettings(settings: Settings): Promise<void>;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>({ meters: [], readings: [], settings: DEFAULT_SETTINGS });
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    setSnapshot(await repo.load());
    setReady(true);
  }, []);

  useEffect(() => {
    let alive = true;
    repo
      .load()
      .then((loaded) => {
        if (alive) setSnapshot(loaded);
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<Store>(
    () => ({
      ...snapshot,
      ready,
      persistent: repo.persistent,
      async addMeter(input) {
        const id = await repo.addMeter(input);
        await reload();
        return id;
      },
      async updateMeter(id, input) {
        await repo.updateMeter(id, input);
        await reload();
      },
      async deleteMeter(id) {
        await repo.deleteMeter(id);
        await reload();
      },
      async addReading(input) {
        await repo.addReading(input);
        await reload();
      },
      async updateReading(id, input) {
        await repo.updateReading(id, input);
        await reload();
      },
      async deleteReading(id) {
        await repo.deleteReading(id);
        await reload();
      },
      async saveSettings(settings) {
        await repo.saveSettings(settings);
        await reload();
      },
    }),
    [snapshot, ready, reload],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
