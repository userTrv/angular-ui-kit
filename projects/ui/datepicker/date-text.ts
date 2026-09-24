import { Signal, computed, linkedSignal } from '@angular/core';
import { formatDate, parseDate } from './date-locale';
import { isSameDay } from './date-utils';

/**
 * @internal Keeps the text of a date `<input>` in sync with a `Date | null` value.
 *
 * External value changes re-format the text; text the user typed is left untouched while it
 * still represents the current value (so typing `1/2/20` is not rewritten mid-keystroke), and
 * unparseable text stays visible and is flagged via `parseError`.
 */
export class DateText {
  /** The last date this helper wrote to the value, compared by identity. */
  private written: Date | null | undefined = undefined;

  /** Current text of the input. */
  readonly text = linkedSignal<{ value: Date | null; locale: string }, string>({
    source: () => ({ value: this.value(), locale: this.locale() }),
    computation: (source, previous) => {
      const localeChanged = previous && previous.source.locale !== source.locale;
      if (previous && !localeChanged && source.value === this.written) return previous.value;
      return formatDate(source.value, source.locale);
    },
  });

  /** True when the input holds text that is not a valid date in the current locale. */
  readonly parseError = computed(() => this.text().trim() !== '' && parseDate(this.text(), this.locale()) === null);

  constructor(
    private readonly value: Signal<Date | null>,
    private readonly write: (date: Date | null) => void,
    private readonly locale: Signal<string>,
  ) {}

  /** Handles an `input` event: parses the text and writes the date (or `null`) when it changed. */
  onInput(text: string): void {
    const parsed = text.trim() ? parseDate(text, this.locale()) : null;
    const current = this.value();
    this.text.set(text);
    if (parsed === current || isSameDay(parsed, current)) return;
    this.written = parsed;
    this.write(parsed);
  }

  /** Re-formats valid text into the canonical locale format (call on blur). */
  normalize(): void {
    if (!this.parseError()) this.text.set(formatDate(this.value(), this.locale()));
  }
}
