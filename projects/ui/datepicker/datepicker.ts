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
import { UI_FORM_FIELD_CONTEXT, UiFormFieldControl, provideUiFormFieldControl } from '@usertrv/ui/form-field';
import { UiFormValueControl, injectUiControlState, provideUiFormValueControl } from '@usertrv/ui/forms';
import { UiCalendar, UiDateFilter } from './calendar';
import { getDateFormatPattern } from './date-locale';
import { DateText } from './date-text';
import { UiWeekday, isWithinBounds } from './date-utils';
import { UI_DATEPICKER_INTL } from './datepicker-intl';
import { DatepickerPopup } from './datepicker-popup';

/**
 * A date field: a text input that parses dates typed in the locale's numeric format, plus a
 * button that opens a `ui-calendar` in a modal popup (WAI-ARIA APG "Date Picker Dialog").
 *
 * The value is a local-midnight `Date` or `null`. Works with Signal Forms (`[formField]`) natively
 * and with Reactive Forms / `ngModel` through `UiControlValueAccessor`.
 */
@Component({
  selector: 'ui-datepicker',
  exportAs: 'uiDatepicker',
  imports: [UiCalendar, CdkTrapFocus],
  templateUrl: './datepicker.html',
  styleUrl: './datepicker.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideUiFormValueControl(UiDatepicker), provideUiFormFieldControl(UiDatepicker)],
  host: {
    class: 'ui-datepicker',
    '[class.ui-datepicker--disabled]': 'isDisabled()',
    '[class.ui-datepicker--invalid]': 'showInvalid()',
    // The ARIA inputs are forwarded to the inner <input>; keep them off the generic host element.
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[attr.aria-describedby]': 'null',
  },
})
export class UiDatepicker implements FormValueControl<Date | null>, UiFormValueControl<Date | null> {
  protected readonly intl = inject(UI_DATEPICKER_INTL);

  /** Selected day (local midnight) or `null`. */
  readonly value = model<Date | null>(null);
  /** Earliest selectable day. Also bound automatically by Signal Forms' `minDate()` rule. */
  readonly min = input<Date | undefined>(undefined);
  /** Latest selectable day. Also bound automatically by Signal Forms' `maxDate()` rule. */
  readonly max = input<Date | undefined>(undefined);
  /** Days for which this returns `false` cannot be picked in the calendar. */
  readonly dateFilter = input<UiDateFilter | null>(null);
  /** BCP 47 locale for parsing, formatting and the calendar. Defaults to `LOCALE_ID`. */
  readonly locale = input<string>(inject(LOCALE_ID));
  /** First column of the calendar (0 = Sunday). Defaults to the locale's week start. */
  readonly firstDayOfWeek = input<UiWeekday | null | undefined>(null);
  /** Placeholder of the text input. Defaults to the locale's pattern, e.g. `MM/DD/YYYY`. */
  readonly placeholder = input<string | undefined>(undefined);
  /** Disables the input and the toggle. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Makes the input read-only and disables the calendar toggle. */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Marks the input as required. */
  readonly required = input(false, { transform: booleanAttribute });
  /**
   * Marks the value invalid (bound automatically by Signal Forms). Displayed once the control is
   * touched, so required fields are not red before the user got to them. Unparseable or
   * out-of-range text is always shown as invalid.
   */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Whether the user has interacted with the control (bound automatically by Signal Forms). */
  readonly touched = input(false, { transform: booleanAttribute });
  /** `name` attribute of the text input. */
  readonly name = input('');
  /** `id` of the text input, for `<label for>`. */
  readonly inputId = input(injectId('ui-datepicker-input'));
  /** Accessible name of the input when there is no `<label for>`. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  /** Id(s) of element(s) labelling the input. */
  readonly ariaLabelledby = input<string | null>(null, { alias: 'aria-labelledby' });
  /** Id(s) of element(s) describing the input (hint, error message). */
  readonly ariaDescribedby = input<string | null>(null, { alias: 'aria-describedby' });

  /** Emitted when the user leaves the input or closes the popup (marks the control touched). */
  readonly touch = output<void>();
  /** @internal Adapter contract: the model Reactive Forms / ngModel read and write. */
  readonly formModel = this.value;

  private readonly formDisabled = signal(false);
  private readonly state = injectUiControlState();
  private readonly formField = inject(UI_FORM_FIELD_CONTEXT, { optional: true });
  /** Own touched flag for use without Signal Forms; follows the `touched` input when it changes. */
  private readonly interacted = linkedSignal(() => this.touched());
  private readonly field = viewChild.required<ElementRef<HTMLElement>>('field');
  private readonly toggleButton = viewChild<ElementRef<HTMLButtonElement>>('toggleButton');
  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('input');
  private readonly popupTemplate = viewChild.required<TemplateRef<unknown>>('popupTemplate');

  protected readonly dateText = new DateText(this.value, (date) => this.value.set(date), this.locale);
  protected readonly popup = new DatepickerPopup({
    origin: () => this.field().nativeElement,
    toggle: () => this.toggleButton()?.nativeElement,
    template: () => this.popupTemplate(),
    closed: () => this.markTouched(),
  });

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly placeholderText = computed(() => this.placeholder() ?? getDateFormatPattern(this.locale()).hint);
  protected readonly outOfBounds = computed(() => {
    const value = this.value();
    return !!value && !isWithinBounds(value, this.min(), this.max());
  });
  protected readonly showInvalid = computed(
    () =>
      this.formField?.invalidOverride() ??
      ((this.invalid() && this.interacted()) ||
        // Reactive Forms / ngModel: the bound control's state (Signal Forms binds `invalid` above).
        (this.state.source() === 'forms' && this.state.errorVisible()) ||
        this.dateText.parseError() ||
        this.outOfBounds()),
  );
  protected readonly isRequired = computed(() => this.required() || this.state.required());
  protected readonly describedBy = computed(
    () => [this.ariaDescribedby(), this.formField?.describedBy()].filter(Boolean).join(' ') || null,
  );
  /** @internal Contract for an enclosing `ui-form-field`. */
  readonly formFieldControl: UiFormFieldControl = {
    id: this.inputId,
    errorVisible: this.showInvalid,
    required: this.isRequired,
    focus: () => this.focus(),
  };

  /** Opens the calendar popup and moves focus into it. */
  open(): void {
    if (!this.isDisabled() && !this.readonly()) this.popup.open();
  }

  /** Moves focus to the text input. */
  focus(options?: FocusOptions): void {
    this.inputEl()?.nativeElement.focus(options);
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

  protected onInput(event: Event): void {
    this.dateText.onInput((event.target as HTMLInputElement).value);
  }

  protected onBlur(): void {
    this.dateText.normalize();
    this.markTouched();
  }

  protected onInputKeydown(event: KeyboardEvent): void {
    if (event.altKey && event.key === 'ArrowDown') {
      event.preventDefault();
      this.open();
    }
  }

  protected onDateSelected(date: Date): void {
    this.value.set(date);
    this.close();
  }

  private markTouched(): void {
    this.interacted.set(true);
    this.touch.emit();
  }
}
