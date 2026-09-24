import { CdkTrapFocus } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  LOCALE_ID,
  TemplateRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { injectId } from '@usertrv/ui/a11y';
import { UiFormValueControl, provideUiFormValueControl } from '@usertrv/ui/forms';
import { UiCalendar, UiDateFilter } from './calendar';
import { getDateFormatPattern } from './date-locale';
import { DateText } from './date-text';
import { UiDateRange, UiWeekday, compareDays, isWithinBounds } from './date-utils';
import { UI_DATEPICKER_INTL } from './datepicker-intl';
import { DatepickerPopup } from './datepicker-popup';

/**
 * A date range field: two text inputs (start and end, each parsed in the locale's numeric
 * format) inside one labelled group, plus a button that opens a `ui-calendar` in range mode.
 *
 * Two inputs rather than one formatted `start – end` field: each date is a separate, clearly
 * labelled field for screen readers, can be corrected on its own, and parsing never has to guess
 * where one date ends and the other starts.
 *
 * The value is `{ start, end }` (local-midnight dates or `null`). Works with Signal Forms
 * natively and with Reactive Forms / `ngModel` through `UiControlValueAccessor`.
 */
@Component({
  selector: 'ui-date-range-picker',
  exportAs: 'uiDateRangePicker',
  imports: [UiCalendar, CdkTrapFocus],
  templateUrl: './date-range-picker.html',
  styleUrl: './datepicker.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideUiFormValueControl(UiDateRangePicker)],
  host: {
    class: 'ui-date-range-picker',
    '[class.ui-date-range-picker--disabled]': 'isDisabled()',
    '[class.ui-date-range-picker--invalid]': 'formInvalid() || startInvalid() || endInvalid()',
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[attr.aria-describedby]': 'null',
  },
})
export class UiDateRangePicker implements FormValueControl<UiDateRange>, UiFormValueControl<UiDateRange> {
  protected readonly intl = inject(UI_DATEPICKER_INTL);

  /** Selected range; either end may be `null`. */
  readonly value = model<UiDateRange>({ start: null, end: null });
  /**
   * Earliest selectable day. (Named `minDate` rather than `min`: Signal Forms types a control's
   * `min` as the control's value type, which here is a range, not a date.)
   */
  readonly minDate = input<Date | null | undefined>(null);
  /** Latest selectable day. */
  readonly maxDate = input<Date | null | undefined>(null);
  /** Days for which this returns `false` cannot be picked in the calendar. */
  readonly dateFilter = input<UiDateFilter | null>(null);
  /** BCP 47 locale for parsing, formatting and the calendar. Defaults to `LOCALE_ID`. */
  readonly locale = input<string>(inject(LOCALE_ID));
  /** First column of the calendar (0 = Sunday). Defaults to the locale's week start. */
  readonly firstDayOfWeek = input<UiWeekday | null | undefined>(null);
  /** Placeholder of both inputs. Defaults to the locale's pattern, e.g. `MM/DD/YYYY`. */
  readonly placeholder = input<string | undefined>(undefined);
  /** Disables both inputs and the toggle. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Makes both inputs read-only and disables the calendar toggle. */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Marks both inputs as required. */
  readonly required = input(false, { transform: booleanAttribute });
  /**
   * Marks the value invalid (bound automatically by Signal Forms). Displayed once the control is
   * touched; unparseable, out-of-range or reversed dates are always shown as invalid.
   */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Whether the user has interacted with the control (bound automatically by Signal Forms). */
  readonly touched = input(false, { transform: booleanAttribute });
  /** `name` prefix: the inputs get `<name>-start` and `<name>-end`. */
  readonly name = input('');
  /** `id` of the start input, for `<label for>`; the end input gets `<inputId>-end`. */
  readonly inputId = input(injectId('ui-date-range-picker-input'));
  /** Accessible name of the group (each input is additionally named "Start date" / "End date"). */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  /** Id(s) of element(s) labelling the group — use it to point at a visible label. */
  readonly ariaLabelledby = input<string | null>(null, { alias: 'aria-labelledby' });
  /** Id(s) of element(s) describing both inputs (hint, error message). */
  readonly ariaDescribedby = input<string | null>(null, { alias: 'aria-describedby' });

  /** Emitted when the user leaves an input or closes the popup (marks the control touched). */
  readonly touch = output<void>();
  /** @internal Adapter contract: the model Reactive Forms / ngModel read and write. */
  readonly formModel = this.value;

  private readonly formDisabled = signal(false);
  /** Own touched flag for use without Signal Forms; follows the `touched` input when it changes. */
  private readonly interacted = linkedSignal(() => this.touched());
  private readonly field = viewChild.required<ElementRef<HTMLElement>>('field');
  private readonly toggleButton = viewChild<ElementRef<HTMLButtonElement>>('toggleButton');
  private readonly popupTemplate = viewChild.required<TemplateRef<unknown>>('popupTemplate');

  /** The value with `null` (written by forms on reset / ngModel's first pass) read as an empty range. */
  private readonly range = computed<UiDateRange>(() => this.value() ?? { start: null, end: null });

  protected readonly startText = new DateText(
    computed(() => this.range().start),
    (start) => this.value.set({ ...this.range(), start }),
    this.locale,
  );
  protected readonly endText = new DateText(
    computed(() => this.range().end),
    (end) => this.value.set({ ...this.range(), end }),
    this.locale,
  );
  /** Range being picked in the popup; committed to `value` only once both ends are chosen. */
  protected readonly draft = signal<UiDateRange>({ start: null, end: null });
  protected readonly popup = new DatepickerPopup({
    origin: () => this.field().nativeElement,
    toggle: () => this.toggleButton()?.nativeElement,
    template: () => this.popupTemplate(),
    closed: () => this.markTouched(),
  });

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly placeholderText = computed(() => this.placeholder() ?? getDateFormatPattern(this.locale()).hint);
  protected readonly formInvalid = computed(() => this.invalid() && this.interacted());
  protected readonly startInvalid = computed(() => this.startText.parseError() || this.outOfBounds(this.range().start));
  protected readonly endInvalid = computed(() => {
    const { start, end } = this.range();
    return this.endText.parseError() || this.outOfBounds(end) || (!!start && !!end && compareDays(end, start) < 0);
  });

  /** Opens the calendar popup and moves focus into it. */
  open(): void {
    if (this.isDisabled() || this.readonly()) return;
    this.draft.set(this.range());
    this.popup.open();
  }

  /** Closes the calendar popup and returns focus to the toggle button. */
  close(): void {
    this.popup.close();
  }

  /** @internal Called by `UiControlValueAccessor`. */
  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
    if (disabled) this.popup.close(false);
  }

  protected toggle(): void {
    if (this.popup.isOpen()) this.close();
    else this.open();
  }

  protected onInput(text: DateText, event: Event): void {
    text.onInput((event.target as HTMLInputElement).value);
  }

  protected onBlur(text: DateText): void {
    text.normalize();
    this.markTouched();
  }

  protected onInputKeydown(event: KeyboardEvent): void {
    if (event.altKey && event.key === 'ArrowDown') {
      event.preventDefault();
      this.open();
    }
  }

  protected onRangeSelected(range: UiDateRange): void {
    this.value.set(range);
    this.close();
  }

  private outOfBounds(date: Date | null): boolean {
    return !!date && !isWithinBounds(date, this.minDate(), this.maxDate());
  }

  private markTouched(): void {
    this.interacted.set(true);
    this.touch.emit();
  }
}
