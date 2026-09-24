import { InjectionToken, Provider } from '@angular/core';

/**
 * Non-date UI strings of the calendar and pickers. Month and weekday names come from `Intl`
 * and follow the `locale` input; these labels are plain strings, so translate them with
 * `provideUiDatepickerIntl()` (e.g. from your i18n catalogue).
 */
export interface UiDatepickerIntl {
  previousMonth: string;
  nextMonth: string;
  previousYear: string;
  nextYear: string;
  /** Accessible name of the toggle button and the popup dialog of `ui-datepicker`. */
  chooseDate: string;
  /** Accessible name of the toggle button and the popup dialog of `ui-date-range-picker`. */
  chooseDateRange: string;
  /** Accessible names of the two fields of `ui-date-range-picker`. */
  startDate: string;
  endDate: string;
}

const DEFAULT_INTL: UiDatepickerIntl = {
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  previousYear: 'Previous year',
  nextYear: 'Next year',
  chooseDate: 'Choose date',
  chooseDateRange: 'Choose date range',
  startDate: 'Start date',
  endDate: 'End date',
};

/** Injection token holding the datepicker UI strings (English by default). */
export const UI_DATEPICKER_INTL = new InjectionToken<UiDatepickerIntl>('UI_DATEPICKER_INTL', {
  providedIn: 'root',
  factory: () => DEFAULT_INTL,
});

/** Overrides some or all datepicker UI strings for an injector subtree. */
export function provideUiDatepickerIntl(labels: Partial<UiDatepickerIntl>): Provider {
  return { provide: UI_DATEPICKER_INTL, useValue: { ...DEFAULT_INTL, ...labels } };
}
