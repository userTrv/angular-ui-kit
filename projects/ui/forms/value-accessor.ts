import {
  Directive,
  InjectionToken,
  ModelSignal,
  OutputEmitterRef,
  Provider,
  Type,
  forwardRef,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Contract every @usertrv/ui form control implements.
 *
 * Components are Signal Forms controls first (`FormValueControl` / `FormCheckboxControl` from
 * `@angular/forms/signals`: a `value` or `checked` model plus optional state inputs). They do NOT
 * provide `NG_VALUE_ACCESSOR` themselves — if they did, `[formField]` would fall back to the
 * ControlValueAccessor interop path. Reactive / template-driven forms go through
 * `UiControlValueAccessor` instead, which talks to the component via this token.
 */
export interface UiFormValueControl<T = unknown> {
  /** The model the adapter reads and writes: `value` for value controls, `checked` for toggles. */
  readonly formModel: ModelSignal<T>;
  /** Emitted when the user leaves the control (marks the control as touched). */
  readonly touch: OutputEmitterRef<void>;
  /** Called by the adapter when the FormControl is enabled/disabled. */
  setDisabledState(disabled: boolean): void;
}

export const UI_FORM_VALUE_CONTROL = new InjectionToken<UiFormValueControl>('UI_FORM_VALUE_CONTROL');

/** Registers a component as a @usertrv/ui form control (use in the component's `providers`). */
export function provideUiFormValueControl(component: Type<unknown>): Provider {
  return { provide: UI_FORM_VALUE_CONTROL, useExisting: forwardRef(() => component) };
}

/**
 * Opt-in `ControlValueAccessor` for Reactive Forms and `ngModel`.
 *
 * ```ts
 * imports: [ReactiveFormsModule, UiSelect, UiControlValueAccessor]
 * // <ui-select formControlName="country" />
 * ```
 *
 * Signal Forms (`[formField]`) need no adapter: the components implement the Signal Forms
 * control contract natively, so apps that only use Signal Forms never ship this code.
 */
@Directive({
  // Must be a static string for the Angular compiler. Keep in sync with the kit's form controls.
  // eslint-disable-next-line @angular-eslint/directive-selector -- targets the kit's own ui-* elements
  selector: `
    ui-checkbox[formControl], ui-checkbox[formControlName], ui-checkbox[ngModel],
    ui-switch[formControl], ui-switch[formControlName], ui-switch[ngModel],
    ui-radio-group[formControl], ui-radio-group[formControlName], ui-radio-group[ngModel],
    ui-select[formControl], ui-select[formControlName], ui-select[ngModel],
    ui-combobox[formControl], ui-combobox[formControlName], ui-combobox[ngModel],
    ui-datepicker[formControl], ui-datepicker[formControlName], ui-datepicker[ngModel],
    ui-date-range-picker[formControl], ui-date-range-picker[formControlName], ui-date-range-picker[ngModel]
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: UiControlValueAccessor, multi: true }],
})
export class UiControlValueAccessor<T = unknown> implements ControlValueAccessor {
  private readonly control = inject(UI_FORM_VALUE_CONTROL, { self: true }) as UiFormValueControl<T>;
  /** True while the form writes into the component, so the write is not echoed back as a user change. */
  private writing = false;

  writeValue(value: T): void {
    this.writing = true;
    this.control.formModel.set(value);
    this.writing = false;
  }

  registerOnChange(fn: (value: T) => void): void {
    // Output subscriptions end with the component, which shares this directive's lifetime.
    this.control.formModel.subscribe((value) => {
      if (!this.writing) fn(value);
    });
  }

  registerOnTouched(fn: () => void): void {
    this.control.touch.subscribe(fn);
  }

  setDisabledState(disabled: boolean): void {
    this.control.setDisabledState(disabled);
  }
}
