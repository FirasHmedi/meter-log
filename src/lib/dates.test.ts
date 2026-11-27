import { addDays, addMonths, daysBetween, daysInMonth, isValidDay, nextMonth } from './dates';

describe('dates', () => {
  it('counts days across months and leap years', () => {
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2);
    expect(daysBetween('2025-02-28', '2025-03-01')).toBe(1);
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
  });

  it('rejects impossible dates', () => {
    expect(isValidDay('2025-02-29')).toBe(false);
    expect(isValidDay('2025-13-01')).toBe(false);
    expect(isValidDay('25-01-01')).toBe(false);
    expect(isValidDay('2024-02-29')).toBe(true);
  });

  it('handles month arithmetic', () => {
    expect(daysInMonth('2024-02')).toBe(29);
    expect(daysInMonth('2026-04')).toBe(30);
    expect(nextMonth('2026-12')).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-03', -14)).toBe('2025-01');
  });
});
