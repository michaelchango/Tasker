import { describe, test, expect } from 'vitest';
import { getMonthNames, formatLocalDate } from '../App.jsx';

describe('getMonthNames', () => {
  test('returns English month names when lang is en', () => {
    const months = getMonthNames('en');
    expect(months[0]).toBe('Jan');
    expect(months[11]).toBe('Dec');
    expect(months).toHaveLength(12);
  });

  test('returns Chinese month names when lang is zh', () => {
    const months = getMonthNames('zh');
    expect(months[0]).toBe('一月');
    expect(months[11]).toBe('十二月');
    expect(months).toHaveLength(12);
  });

  test('defaults to Chinese when no lang provided', () => {
    const months = getMonthNames();
    expect(months[0]).toBe('一月');
  });

  describe('formatLocalDate', () => {
    test('formats a given Date instance correctly', () => {
      const d = new Date(2023, 0, 5); // Jan 5 2023
      expect(formatLocalDate(d)).toBe('2023-01-05');
    });

    test('roundtrips through parse/format without offset', () => {
      const str = '2023-12-31';
      const [y, m, day] = str.split('-');
      const d = new Date(y, Number(m) - 1, Number(day));
      expect(formatLocalDate(d)).toBe(str);
    });
  });
});
