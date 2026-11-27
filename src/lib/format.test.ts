import { readingsToCsv } from './csv';
import { formatMoney, formatNumber, parseDecimal } from './format';
import { resolveUnit } from './meters';

describe('parseDecimal', () => {
  it('accepts French and English decimal separators', () => {
    expect(parseDecimal('1234,5')).toBe(1234.5);
    expect(parseDecimal('1234.5')).toBe(1234.5);
    expect(parseDecimal('1 234,5')).toBe(1234.5);
    expect(parseDecimal('1,234.5')).toBe(1234.5);
    expect(parseDecimal('1.234,5')).toBe(1234.5);
    expect(parseDecimal(' 42 ')).toBe(42);
  });

  it('rejects text that is not a number', () => {
    expect(parseDecimal('')).toBeNaN();
    expect(parseDecimal('abc')).toBeNaN();
    expect(parseDecimal('1,2,3')).toBeNaN();
    expect(parseDecimal('12kWh')).toBeNaN();
  });
});

describe('locale formats', () => {
  it('formats numbers per locale', () => {
    expect(formatNumber(1234.5, 'en-US', 1)).toBe('1,234.5');
    expect(formatNumber(1234.5, 'fr-FR', 1).replace(/[  ]/g, ' ')).toBe('1 234,5');
  });

  it('formats money with the currency', () => {
    expect(formatMoney(12.5, 'en-US', 'USD')).toBe('$12.50');
    expect(formatMoney(12.5, 'fr-FR', 'EUR').replace(/[  ]/g, ' ')).toBe('12,50 €');
  });
});

describe('units', () => {
  it('uses fixed units for known kinds and the typed unit for custom meters', () => {
    expect(resolveUnit('electricity', 'x')).toBe('kWh');
    expect(resolveUnit('water', '')).toBe('m³');
    expect(resolveUnit('custom', ' L ')).toBe('L');
  });
});

describe('readingsToCsv', () => {
  it('exports readings with consumption and quotes names when needed', () => {
    const csv = readingsToCsv('House, ground floor', 'kWh', [
      { id: 2, date: '2026-01-11', value: 110.5, reset: false },
      { id: 1, date: '2026-01-01', value: 100, reset: false },
    ]);
    expect(csv.split('\n')).toEqual([
      'meter,unit,date,value,reset,consumption_since_previous,days_since_previous',
      '"House, ground floor",kWh,2026-01-01,100,no,,',
      '"House, ground floor",kWh,2026-01-11,110.5,no,10.5,10',
      '',
    ]);
  });
});
