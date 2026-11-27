import { addReadingLink, daysSinceLabel, selectWidgetRows } from './widget';

const meters = [
  { id: 1, name: 'Electricity', unit: 'kWh' },
  { id: 2, name: 'Gas', unit: 'm³' },
  { id: 3, name: 'Water', unit: 'm³' },
];

const r = (id: number, meterId: number, date: string, value: number) => ({ id, meterId, date, value, reset: false });

describe('selectWidgetRows', () => {
  it('returns nothing without meters', () => {
    expect(selectWidgetRows([], [], '2026-11-27')).toEqual([]);
  });

  it('shows the last reading and the days since it', () => {
    const rows = selectWidgetRows(meters.slice(0, 1), [r(1, 1, '2026-11-01', 100), r(2, 1, '2026-11-20', 150)], '2026-11-27');
    expect(rows).toEqual([{ meterId: 1, name: 'Electricity', unit: 'kWh', last: { value: 150, date: '2026-11-20', daysSince: 7 } }]);
  });

  it('keeps at most two meters by default', () => {
    expect(selectWidgetRows(meters, [], '2026-11-27')).toHaveLength(2);
    expect(selectWidgetRows(meters, [], '2026-11-27', 3)).toHaveLength(3);
  });

  it('puts meters without a reading first, then the oldest last reading', () => {
    const readings = [r(1, 1, '2026-11-25', 10), r(2, 2, '2026-10-01', 20)];
    const rows = selectWidgetRows(meters, readings, '2026-11-27', 3);
    expect(rows.map((x) => x.meterId)).toEqual([3, 2, 1]);
    expect(rows[0].last).toBeNull();
  });

  it('keeps the app order on ties', () => {
    const readings = [r(1, 1, '2026-11-20', 10), r(2, 2, '2026-11-20', 20), r(3, 3, '2026-11-20', 30)];
    expect(selectWidgetRows(meters, readings, '2026-11-27').map((x) => x.meterId)).toEqual([1, 2]);
  });

  it('uses the latest reading by date, not by insertion order', () => {
    const rows = selectWidgetRows(meters.slice(0, 1), [r(5, 1, '2026-11-20', 150), r(6, 1, '2026-11-02', 100)], '2026-11-27');
    expect(rows[0].last?.value).toBe(150);
  });

  it('never shows negative days for a reading dated after today', () => {
    const rows = selectWidgetRows(meters.slice(0, 1), [r(1, 1, '2026-11-28', 10)], '2026-11-27');
    expect(rows[0].last?.daysSince).toBe(0);
  });
});

describe('daysSinceLabel', () => {
  it('says today, yesterday or a number of days', () => {
    expect(daysSinceLabel(0).key).toBe('today');
    expect(daysSinceLabel(1).key).toBe('yesterday');
    expect(daysSinceLabel(12)).toEqual({ key: 'days', days: 12 });
  });
});

describe('addReadingLink', () => {
  it('opens the add-reading screen of the meter', () => {
    expect(addReadingLink(4)).toBe('meterlog://reading?meterId=4');
  });
});
