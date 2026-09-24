import { UiWeekday, daysInMonth, isValidDate } from './date-utils';

/*
 * Locale data derived from `Intl` only — no bundled locale tables except a tiny
 * first-day-of-week fallback for engines without `Intl.Locale#getWeekInfo`.
 */

interface WeekInfo {
  /** 1 = Monday … 7 = Sunday (ISO numbering, as returned by Intl). */
  firstDay: number;
}

type LocaleWithWeekInfo = Intl.Locale & { getWeekInfo?: () => WeekInfo; weekInfo?: WeekInfo };

/** Regions whose week starts on Sunday / Saturday (CLDR); everything else starts on Monday. */
const SUNDAY_REGIONS = new Set(
  'AG AS BD BR BS BT BW BZ CA CN CO DM DO ET GT GU HK HN ID IL IN JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW'.split(
    ' ',
  ),
);
const SATURDAY_REGIONS = new Set('AE AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY'.split(' '));

/**
 * First day of the week for a locale, as a `Date#getDay()` number (0 = Sunday).
 * Uses `Intl.Locale#getWeekInfo()` (or the older `weekInfo` getter) and falls back to a small
 * CLDR-based region table when the engine has neither.
 */
export function getFirstDayOfWeek(locale: string): UiWeekday {
  let intlLocale: LocaleWithWeekInfo;
  try {
    intlLocale = new Intl.Locale(locale) as LocaleWithWeekInfo;
  } catch {
    return 1;
  }
  const info = intlLocale.getWeekInfo?.() ?? intlLocale.weekInfo;
  if (info && typeof info.firstDay === 'number') return (info.firstDay % 7) as UiWeekday;
  return firstDayFromRegion(intlLocale.maximize().region);
}

/** @internal Exposed for tests: the fallback used when `Intl` has no week data. */
export function firstDayFromRegion(region: string | undefined): UiWeekday {
  if (region && SUNDAY_REGIONS.has(region)) return 0;
  if (region && SATURDAY_REGIONS.has(region)) return 6;
  return 1;
}

/** Weekday names in display order starting at `firstDayOfWeek`. */
export function getWeekdayNames(
  locale: string,
  firstDayOfWeek: UiWeekday,
): { short: string; long: string; day: UiWeekday }[] {
  const short = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const long = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  // 2023-01-01 was a Sunday, so 2023-01-(1 + n) has getDay() === n.
  return Array.from({ length: 7 }, (_, i) => {
    const day = ((firstDayOfWeek + i) % 7) as UiWeekday;
    const date = new Date(2023, 0, 1 + day);
    return { short: short.format(date), long: long.format(date), day };
  });
}

type DatePart = 'day' | 'month' | 'year';

/** A locale's numeric short date layout, e.g. `['month','day','year']` + a user-facing hint. */
export interface UiDateFormatPattern {
  /** Order of the numeric fields. */
  order: DatePart[];
  /** Human-readable pattern such as `MM/DD/YYYY`, used as the default placeholder. */
  hint: string;
}

const NUMERIC_DATE: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
const patternCache = new Map<string, UiDateFormatPattern>();

/** Derives the field order and separators from `Intl.DateTimeFormat#formatToParts`. */
export function getDateFormatPattern(locale: string): UiDateFormatPattern {
  const cached = patternCache.get(locale);
  if (cached) return cached;
  const parts = new Intl.DateTimeFormat(locale, NUMERIC_DATE).formatToParts(new Date(2026, 10, 22));
  const order: DatePart[] = [];
  let hint = '';
  for (const part of parts) {
    if (part.type === 'day' || part.type === 'month' || part.type === 'year') {
      order.push(part.type);
      hint += part.type === 'day' ? 'DD' : part.type === 'month' ? 'MM' : 'YYYY';
    } else if (part.type === 'literal') {
      // Drop bidi marks (e.g. U+200F in Arabic) so the hint is plain text.
      hint += part.value.replace(/[\u200e\u200f\u061c]/g, '');
    }
  }
  const pattern = { order: order.length === 3 ? order : (['month', 'day', 'year'] as DatePart[]), hint };
  patternCache.set(locale, pattern);
  return pattern;
}

/** Formats a date with the locale's numeric short date (the same layout `parseDate` accepts). */
export function formatDate(date: Date | null, locale: string): string {
  return date && isValidDate(date) ? new Intl.DateTimeFormat(locale, NUMERIC_DATE).format(date) : '';
}

/** Converts Arabic-Indic and Extended Arabic-Indic digits to ASCII digits. */
function toAsciiDigits(text: string): string {
  return text.replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) & 0xf));
}

/**
 * Parses typed text in the locale's numeric date layout (any non-digit separators; one- or
 * two-digit day/month; two-digit years map to 2000–2099). Returns `null` for anything that is
 * not a real calendar date (e.g. `31/02/2026`).
 */
export function parseDate(text: string, locale: string): Date | null {
  const groups = toAsciiDigits(text).match(/\d+/g);
  if (!groups || groups.length !== 3) return null;
  const { order } = getDateFormatPattern(locale);
  const fields: Partial<Record<DatePart, string>> = {};
  order.forEach((part, i) => (fields[part] = groups[i]));
  const { day: d = '', month: m = '', year: y = '' } = fields;
  if (d.length > 2 || m.length > 2 || (y.length !== 2 && y.length !== 4)) return null;
  const year = y.length === 2 ? 2000 + Number(y) : Number(y);
  const month = Number(m) - 1;
  const day = Number(d);
  if (month < 0 || month > 11 || day < 1 || day > daysInMonth(year, month)) return null;
  const date = new Date(year, month, day);
  // Years 0–99 are mapped to 1900–1999 by the constructor; setFullYear keeps them literal.
  date.setFullYear(year);
  return date;
}
