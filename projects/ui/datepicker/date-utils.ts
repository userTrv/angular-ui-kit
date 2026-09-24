/*
 * Pure date-only arithmetic on plain `Date` objects (local time, midnight).
 *
 * Every function builds results from year/month/day components (`new Date(y, m, d)`) instead of
 * adding milliseconds, so days that are 23 or 25 hours long around DST transitions never shift a
 * date by one. Inputs are never mutated.
 */

/** A day of the week as returned by `Date.prototype.getDay()`: 0 = Sunday … 6 = Saturday. */
export type UiWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** A selected range of days; either end may be missing while the user is still choosing. */
export interface UiDateRange {
  /** First day of the range (inclusive). */
  start: Date | null;
  /** Last day of the range (inclusive). */
  end: Date | null;
}

/** Returns a new date at local midnight of the same calendar day. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Today at local midnight. */
export function today(): Date {
  return startOfDay(new Date());
}

/** True for a `Date` whose time value is a number (not `new Date('nonsense')`). */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

/** Gregorian leap year rule. */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Number of days in `month` (0-based) of `year`. */
export function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one; the constructor normalises overflow.
  return new Date(year, month + 1, 0).getDate();
}

/** Adds (or subtracts) whole calendar days. DST-safe. */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * Adds calendar months, clamping the day to the target month's length
 * (Jan 31 + 1 month = Feb 28/29, not Mar 3).
 */
export function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const day = Math.min(date.getDate(), daysInMonth(target.getFullYear(), target.getMonth()));
  return new Date(target.getFullYear(), target.getMonth(), day);
}

/** Adds calendar years (Feb 29 + 1 year = Feb 28). */
export function addYears(date: Date, years: number): Date {
  return addMonths(date, years * 12);
}

/** First day of the date's month. */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Last day of the date's month. */
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/** The first day of the week containing `date`, for weeks starting on `firstDayOfWeek`. */
export function startOfWeek(date: Date, firstDayOfWeek: UiWeekday): Date {
  const offset = (date.getDay() - firstDayOfWeek + 7) % 7;
  return addDays(date, -offset);
}

/** The last day of the week containing `date`, for weeks starting on `firstDayOfWeek`. */
export function endOfWeek(date: Date, firstDayOfWeek: UiWeekday): Date {
  return addDays(startOfWeek(date, firstDayOfWeek), 6);
}

/** Same calendar day (ignores time). `null` never matches. */
export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  return (
    !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

/** Same calendar month and year. */
export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Negative when `a` is an earlier day than `b`, 0 on the same day, positive when later. */
export function compareDays(a: Date, b: Date): number {
  return a.getFullYear() - b.getFullYear() || a.getMonth() - b.getMonth() || a.getDate() - b.getDate();
}

/** Clamps `date` into `[min, max]` (either bound optional), comparing whole days. */
export function clampDate(date: Date, min?: Date | null, max?: Date | null): Date {
  if (min && compareDays(date, min) < 0) return startOfDay(min);
  if (max && compareDays(date, max) > 0) return startOfDay(max);
  return date;
}

/** True when `date` lies within `[min, max]` (either bound optional). */
export function isWithinBounds(date: Date, min?: Date | null, max?: Date | null): boolean {
  return (!min || compareDays(date, min) >= 0) && (!max || compareDays(date, max) <= 0);
}

/** True when `date` lies between the two ends of a range, inclusive, in either order. */
export function isInRange(date: Date, a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  const [lo, hi] = compareDays(a, b) <= 0 ? [a, b] : [b, a];
  return compareDays(date, lo) >= 0 && compareDays(date, hi) <= 0;
}

/**
 * Rows of a month view: each week is 7 slots starting on `firstDayOfWeek`; slots outside the
 * month are `null`. Produces 4–6 rows depending on the month.
 */
export function monthWeeks(year: number, month: number, firstDayOfWeek: UiWeekday): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const leading = (first.getDay() - firstDayOfWeek + 7) % 7;
  const length = daysInMonth(year, month);
  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= length; day++) {
    week.push(new Date(year, month, day));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push([...week, ...Array.from({ length: 7 - week.length }, () => null)]);
  return weeks;
}
