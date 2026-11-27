import {
  consumptionByReading,
  cost,
  currentMonthEstimate,
  dailyAverage,
  intervals,
  lastMonths,
  monthlyTotals,
  projection,
  type Reading,
  recentDailyAverage,
  validateReading,
} from './consumption';

let nextId = 1;
const r = (date: string, value: number, reset = false): Reading => ({ id: nextId++, date, value, reset });

describe('intervals', () => {
  it('computes consumption between consecutive readings, whatever the input order', () => {
    const readings = [r('2026-01-31', 1100), r('2026-01-01', 1000), r('2026-02-10', 1150)];
    const ivs = intervals(readings);
    expect(ivs.map((i) => [i.start, i.end, i.days, i.amount])).toEqual([
      ['2026-01-01', '2026-01-31', 30, 100],
      ['2026-01-31', '2026-02-10', 10, 50],
    ]);
  });

  it('starts a new series after a meter reset', () => {
    const readings = [r('2026-01-01', 9000), r('2026-01-11', 9100), r('2026-01-20', 5, true), r('2026-01-30', 65)];
    const ivs = intervals(readings);
    expect(ivs.map((i) => i.amount)).toEqual([100, 60]);
    expect(ivs[1].start).toBe('2026-01-20');
  });

  it('maps consumption to the reading that closes each interval', () => {
    const a = r('2026-03-01', 10);
    const b = r('2026-03-05', 18);
    const map = consumptionByReading([a, b]);
    expect(map.get(a.id)).toBeUndefined();
    expect(map.get(b.id)?.amount).toBe(8);
  });
});

describe('averages', () => {
  it('weights the daily average by interval length', () => {
    const ivs = intervals([r('2026-01-01', 0), r('2026-01-11', 100), r('2026-01-21', 120)]);
    expect(dailyAverage(ivs)).toBe(6);
    expect(dailyAverage([])).toBeNull();
  });

  it('uses only the recent window, cutting the interval at its start', () => {
    // 100 days at 1/day, then 10 days at 10/day
    const ivs = intervals([r('2025-01-01', 0), r('2025-04-11', 100), r('2025-04-21', 200)]);
    // window of 20 days: 10 days at 1/day + 10 days at 10/day -> 110 / 20
    expect(recentDailyAverage(ivs, 20)).toBeCloseTo(5.5);
  });
});

describe('monthlyTotals', () => {
  it('spreads an interval across month boundaries', () => {
    // 31 days from Jan 16 to Feb 16, 310 units -> 10 per day
    const totals = monthlyTotals(intervals([r('2026-01-16', 0), r('2026-02-16', 310)]));
    expect(totals).toEqual([
      { month: '2026-01', amount: 160, coveredDays: 16, daysInMonth: 31 },
      { month: '2026-02', amount: 150, coveredDays: 15, daysInMonth: 28 },
    ]);
  });

  it('skips the unknown gap around a reset', () => {
    const totals = monthlyTotals(
      intervals([r('2026-01-01', 500), r('2026-01-11', 600), r('2026-03-01', 0, true), r('2026-03-11', 50)]),
    );
    expect(totals.map((t) => [t.month, t.amount, t.coveredDays])).toEqual([
      ['2026-01', 100, 10],
      ['2026-03', 50, 10],
    ]);
  });

  it('fills missing months with zero for the chart', () => {
    const months = lastMonths([{ month: '2026-02', amount: 5, coveredDays: 28, daysInMonth: 28 }], '2026-03', 3);
    expect(months.map((m) => [m.month, m.amount])).toEqual([
      ['2026-01', 0],
      ['2026-02', 5],
      ['2026-03', 0],
    ]);
  });
});

describe('estimates and cost', () => {
  it('adds the measured part of the month to the average for the remaining days', () => {
    // 2 per day; readings cover April 1 -> April 11 (10 days measured = 20)
    const readings = [r('2026-03-22', 0), r('2026-04-01', 20), r('2026-04-11', 40)];
    const est = currentMonthEstimate(readings, '2026-04-15');
    expect(est).not.toBeNull();
    expect(est!.measured).toBeCloseTo(20);
    expect(est!.measuredDays).toBe(10);
    expect(est!.estimated).toBeCloseTo(20 + 2 * 20);
    expect(projection(readings, 30)).toBeCloseTo(60);
  });

  it('needs at least two readings', () => {
    expect(currentMonthEstimate([r('2026-04-01', 5)], '2026-04-10')).toBeNull();
    expect(projection([], 30)).toBeNull();
  });

  it('computes cost only when a price is set', () => {
    expect(cost(120, 0.25)).toBe(30);
    expect(cost(120, null)).toBeNull();
    expect(cost(null, 0.25)).toBeNull();
  });
});

describe('validateReading', () => {
  const existing = [r('2026-01-01', 100), r('2026-02-01', 200)];
  const today = '2026-03-01';

  it('accepts a value that keeps the series increasing', () => {
    expect(validateReading(existing, { date: '2026-01-15', value: 150, reset: false }, today)).toBeNull();
    expect(validateReading(existing, { date: '2026-02-15', value: 200, reset: false }, today)).toBeNull();
  });

  it('refuses a value below the previous reading unless the meter was reset', () => {
    expect(validateReading(existing, { date: '2026-02-15', value: 150, reset: false }, today)).toBe('belowPrevious');
    expect(validateReading(existing, { date: '2026-02-15', value: 3, reset: true }, today)).toBeNull();
  });

  it('refuses a value above the next reading', () => {
    expect(validateReading(existing, { date: '2026-01-15', value: 250, reset: false }, today)).toBe('aboveNext');
  });

  it('refuses future dates, same-day duplicates and invalid values', () => {
    expect(validateReading(existing, { date: '2026-03-02', value: 300, reset: false }, today)).toBe('futureDate');
    expect(validateReading(existing, { date: '2026-02-01', value: 300, reset: false }, today)).toBe('sameDay');
    expect(validateReading(existing, { date: '2026-02-20', value: NaN, reset: false }, today)).toBe('invalidValue');
    expect(validateReading(existing, { date: '2026-02-30', value: 300, reset: false }, today)).toBe('invalidDate');
  });

  it('ignores the reading being edited', () => {
    const [first] = existing;
    expect(
      validateReading(existing, { id: first.id, date: '2026-01-01', value: 120, reset: false }, today),
    ).toBeNull();
  });
});
