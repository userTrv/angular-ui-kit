import { InjectionToken, Provider } from '@angular/core';

/** UI strings of `ui-combobox`. Translate them with `provideUiComboboxIntl()`. */
export interface UiComboboxIntl {
  /** Shown (and announced) when nothing matches the query. */
  noResults: string;
  /** Shown while the async `search` is running. */
  loading: string;
  /** Shown (and announced) when the async `search` fails. */
  error: string;
  /** Screen reader announcement of the number of suggestions. */
  resultsAvailable: (count: number) => string;
  /** Accessible name of the button that opens the suggestions. */
  showSuggestions: string;
}

const DEFAULT_INTL: UiComboboxIntl = {
  noResults: 'No results',
  loading: 'Searching…',
  error: 'Could not load results',
  resultsAvailable: (count) => `${count} ${count === 1 ? 'result' : 'results'} available`,
  showSuggestions: 'Show suggestions',
};

/** Injection token holding the combobox UI strings (English by default). */
export const UI_COMBOBOX_INTL = new InjectionToken<UiComboboxIntl>('UI_COMBOBOX_INTL', {
  providedIn: 'root',
  factory: () => DEFAULT_INTL,
});

/** Overrides some or all combobox UI strings for an injector subtree. */
export function provideUiComboboxIntl(labels: Partial<UiComboboxIntl>): Provider {
  return { provide: UI_COMBOBOX_INTL, useValue: { ...DEFAULT_INTL, ...labels } };
}
