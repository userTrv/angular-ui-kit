import { dateForKey } from './calendar-keys';
import {
  addDays,
  addMonths,
  addYears,
  clampDate,
  compareDays,
  daysInMonth,
  endOfWeek,
  isInRange,
  isLeapYear,
  isSameDay,
  isWithinBounds,
  monthWeeks,
  startOfWeek,
} from './date-utils';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);
const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

describe('date-utils', () => {
  it('knows the Gregorian leap year rule', () => {
    expect([2024, 2000, 2400].map(isLeapYear)).toEqual([true, true, true]);
    expect([2026, 1900, 2100].map(isLeapYear)).toEqual([false, false, false]);
  });

  it('computes month lengths, including February in leap years', () => {
    expect(daysInMonth(2026, 0)).toBe(31);
    expect(daysInMonth(2026, 1)).toBe(28);
    expect(daysInMonth(2024, 1)).toBe(29);
    expect(daysInMonth(1900, 1)).toBe(28);
    expect(daysInMonth(2026, 3)).toBe(30);
    expect(daysInMonth(2026, 11)).toBe(31);
  });

  it('adds days across month and year boundaries', () => {
    expect(iso(addDays(d(2026, 1, 31), 1))).toBe('2026-02-01');
    expect(iso(addDays(d(2026, 12, 31), 1))).toBe('2027-01-01');
    expect(iso(addDays(d(2024, 3, 1), -1))).toBe('2024-02-29');
    expect(iso(addDays(d(2026, 9, 24), -7))).toBe('2026-09-17');
  });

  it('adds days across DST transitions without drifting off midnight', () => {
    // Walk a whole year day by day: every result must stay at local midnight and never repeat
    // or skip a day, whatever DST rules the machine's time zone has.
    let date = d(2026, 1, 1);
    for (let i = 0; i < 365; i++) {
      const next = addDays(date, 1);
      expect(next.getHours()).toBe(0);
      expect(compareDays(next, date)).toBeGreaterThan(0);
      expect(next.getDate() === date.getDate() + 1 || next.getDate() === 1).toBe(true);
      date = next;
    }
    expect(iso(date)).toBe('2027-01-01');
  });

  it('clamps the day when adding months and years', () => {
    expect(iso(addMonths(d(2026, 1, 31), 1))).toBe('2026-02-28');
    expect(iso(addMonths(d(2024, 1, 31), 1))).toBe('2024-02-29');
    expect(iso(addMonths(d(2026, 3, 31), -1))).toBe('2026-02-28');
    expect(iso(addMonths(d(2026, 11, 15), 3))).toBe('2027-02-15');
    expect(iso(addYears(d(2024, 2, 29), 1))).toBe('2025-02-28');
    expect(iso(addYears(d(2024, 2, 29), 4))).toBe('2028-02-29');
  });

  it('finds the start and end of a week for any first day', () => {
    const thu = d(2026, 9, 24);
    expect(iso(startOfWeek(thu, 1))).toBe('2026-09-21');
    expect(iso(endOfWeek(thu, 1))).toBe('2026-09-27');
    expect(iso(startOfWeek(thu, 0))).toBe('2026-09-20');
    expect(iso(startOfWeek(thu, 6))).toBe('2026-09-19');
    expect(iso(startOfWeek(d(2026, 9, 20), 1))).toBe('2026-09-14');
  });

  it('compares, clamps and range-checks whole days', () => {
    const noon = new Date(2026, 8, 24, 12);
    expect(isSameDay(noon, d(2026, 9, 24))).toBe(true);
    expect(isSameDay(null, d(2026, 9, 24))).toBe(false);
    expect(iso(clampDate(d(2026, 1, 1), d(2026, 2, 1), d(2026, 3, 1)))).toBe('2026-02-01');
    expect(iso(clampDate(d(2026, 5, 1), d(2026, 2, 1), d(2026, 3, 1)))).toBe('2026-03-01');
    expect(isWithinBounds(d(2026, 2, 1), d(2026, 2, 1), null)).toBe(true);
    expect(isInRange(d(2026, 9, 10), d(2026, 9, 12), d(2026, 9, 8))).toBe(true);
    expect(isInRange(d(2026, 9, 13), d(2026, 9, 12), d(2026, 9, 8))).toBe(false);
  });

  it('lays out a month as full weeks with blanks outside the month', () => {
    // September 2026 starts on a Tuesday.
    const monday = monthWeeks(2026, 8, 1);
    expect(monday.length).toBe(5);
    expect(monday[0].slice(0, 2)).toEqual([null, expect.any(Date)]);
    expect(monday[0][1]?.getDate()).toBe(1);
    expect(monday.every((week) => week.length === 7)).toBe(true);
    expect(monday.flat().filter(Boolean).length).toBe(30);
    // February 2026 starts on a Sunday: exactly 4 rows when weeks start on Sunday.
    expect(monthWeeks(2026, 1, 0).length).toBe(4);
    // August 2026 starts on a Saturday: 6 rows with Monday weeks.
    expect(monthWeeks(2026, 7, 1).length).toBe(6);
  });
});

describe('dateForKey', () => {
  const key = (k: string, shiftKey = false) => new KeyboardEvent('keydown', { key: k, shiftKey });
  const ltr = { firstDayOfWeek: 1 as const, rtl: false };
  const base = d(2026, 1, 31);

  it('maps the APG grid keys', () => {
    expect(iso(dateForKey(key('ArrowRight'), base, ltr)!)).toBe('2026-02-01');
    expect(iso(dateForKey(key('ArrowLeft'), base, ltr)!)).toBe('2026-01-30');
    expect(iso(dateForKey(key('ArrowDown'), base, ltr)!)).toBe('2026-02-07');
    expect(iso(dateForKey(key('ArrowUp'), base, ltr)!)).toBe('2026-01-24');
    expect(iso(dateForKey(key('Home'), base, ltr)!)).toBe('2026-01-26');
    expect(iso(dateForKey(key('End'), base, ltr)!)).toBe('2026-02-01');
    expect(iso(dateForKey(key('PageDown'), base, ltr)!)).toBe('2026-02-28');
    expect(iso(dateForKey(key('PageUp'), base, ltr)!)).toBe('2025-12-31');
    expect(iso(dateForKey(key('PageDown', true), base, ltr)!)).toBe('2027-01-31');
    expect(iso(dateForKey(key('PageUp', true), base, ltr)!)).toBe('2025-01-31');
    expect(dateForKey(key('a'), base, ltr)).toBeNull();
  });

  it('mirrors horizontal arrows in right-to-left layouts', () => {
    const rtl = { firstDayOfWeek: 6 as const, rtl: true };
    expect(iso(dateForKey(key('ArrowLeft'), base, rtl)!)).toBe('2026-02-01');
    expect(iso(dateForKey(key('ArrowRight'), base, rtl)!)).toBe('2026-01-30');
  });
});
