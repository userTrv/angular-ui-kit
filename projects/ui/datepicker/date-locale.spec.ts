import {
  firstDayFromRegion,
  formatDate,
  getDateFormatPattern,
  getFirstDayOfWeek,
  getWeekdayNames,
  parseDate,
} from './date-locale';

const iso = (date: Date | null) =>
  date &&
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

describe('date-locale', () => {
  it('reads the first day of the week from Intl', () => {
    expect(getFirstDayOfWeek('en-US')).toBe(0);
    expect(getFirstDayOfWeek('de-DE')).toBe(1);
    expect(getFirstDayOfWeek('en-GB')).toBe(1);
    expect(getFirstDayOfWeek('ar-EG')).toBe(6);
  });

  it('falls back to region data when Intl.Locale has no week info', () => {
    const proto = Intl.Locale.prototype as unknown as Record<string, unknown>;
    const getWeekInfo = Object.getOwnPropertyDescriptor(proto, 'getWeekInfo');
    const weekInfo = Object.getOwnPropertyDescriptor(proto, 'weekInfo');
    try {
      Object.defineProperty(proto, 'getWeekInfo', { value: undefined, configurable: true });
      Object.defineProperty(proto, 'weekInfo', { get: () => undefined, configurable: true });
      expect(getFirstDayOfWeek('en-US')).toBe(0);
      expect(getFirstDayOfWeek('de')).toBe(1);
      expect(getFirstDayOfWeek('ar-EG')).toBe(6);
    } finally {
      if (getWeekInfo) Object.defineProperty(proto, 'getWeekInfo', getWeekInfo);
      else delete proto['getWeekInfo'];
      if (weekInfo) Object.defineProperty(proto, 'weekInfo', weekInfo);
      else delete proto['weekInfo'];
    }
    expect(firstDayFromRegion(undefined)).toBe(1);
    expect(getFirstDayOfWeek('not a locale!')).toBe(1);
  });

  it('lists weekday names starting at the given day', () => {
    const de = getWeekdayNames('de-DE', 1);
    expect(de[0]).toEqual({ short: 'Mo', long: 'Montag', day: 1 });
    expect(de[6].long).toBe('Sonntag');
    expect(getWeekdayNames('en-US', 0).map((w) => w.long)[0]).toBe('Sunday');
  });

  it('derives the numeric pattern from formatToParts', () => {
    expect(getDateFormatPattern('en-US')).toEqual({ order: ['month', 'day', 'year'], hint: 'MM/DD/YYYY' });
    expect(getDateFormatPattern('de-DE')).toEqual({ order: ['day', 'month', 'year'], hint: 'DD.MM.YYYY' });
    expect(getDateFormatPattern('ja-JP')).toEqual({ order: ['year', 'month', 'day'], hint: 'YYYY/MM/DD' });
    expect(getDateFormatPattern('ar-EG').order).toEqual(['day', 'month', 'year']);
  });

  it('parses dates typed in the locale order with any separators', () => {
    expect(iso(parseDate('09/24/2026', 'en-US'))).toBe('2026-09-24');
    expect(iso(parseDate('9-4-26', 'en-US'))).toBe('2026-09-04');
    expect(iso(parseDate('24.09.2026', 'de-DE'))).toBe('2026-09-24');
    expect(iso(parseDate('2026/9/24', 'ja-JP'))).toBe('2026-09-24');
  });

  it('parses Arabic-Indic digits', () => {
    const text = formatDate(new Date(2026, 8, 24), 'ar-EG');
    expect(text).toMatch(/[\u0660-\u0669]/);
    expect(iso(parseDate(text, 'ar-EG'))).toBe('2026-09-24');
  });

  it('rejects text that is not a real date', () => {
    expect(parseDate('', 'en-US')).toBeNull();
    expect(parseDate('tomorrow', 'en-US')).toBeNull();
    expect(parseDate('02/30/2026', 'en-US')).toBeNull();
    expect(parseDate('13/01/2026', 'en-US')).toBeNull();
    expect(parseDate('02/29/2026', 'en-US')).toBeNull();
    expect(iso(parseDate('02/29/2024', 'en-US'))).toBe('2024-02-29');
    expect(parseDate('1/2/3/4', 'en-US')).toBeNull();
    expect(parseDate('1/2/202', 'en-US')).toBeNull();
  });

  it('formats and parses round-trip', () => {
    for (const locale of ['en-US', 'de-DE', 'ja-JP', 'ar-EG', 'fr-FR']) {
      const date = new Date(2027, 0, 5);
      expect(iso(parseDate(formatDate(date, locale), locale)), locale).toBe('2027-01-05');
    }
    expect(formatDate(null, 'en-US')).toBe('');
  });
});
