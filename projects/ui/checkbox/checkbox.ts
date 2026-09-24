import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormCheckboxControl } from '@angular/forms/signals';
import { injectId } from '@usertrv/ui/a11y';
import { UiFormValueControl, injectUiControlState, provideUiFormValueControl } from '@usertrv/ui/forms';

/**
 * Checkbox with a custom visual on top of a real `<input type="checkbox">`, so the role, the
 * checked/mixed state, Space to toggle and native form submission all come from the browser.
 * The label is the projected content.
 *
 * Works with Signal Forms (`[formField]`, it is a `FormCheckboxControl`) and — through
 * `UiControlValueAccessor` from `@usertrv/ui/forms` — with `formControl`, `formControlName` and `ngModel`.
 */
@Component({
  selector: 'ui-checkbox',
  exportAs: 'uiCheckbox',
  template: `
    <label class="ui-checkbox__label">
      <span class="ui-checkbox__control">
        <input
          #native
          type="checkbox"
          class="ui-checkbox__input"
          [id]="inputId()"
          [checked]="checked()"
          [indeterminate]="indeterminate()"
          [disabled]="isDisabled()"
          [attr.name]="name() || null"
          [attr.aria-invalid]="showInvalid() || null"
          [attr.aria-required]="isRequired() || null"
          [attr.aria-label]="ariaLabel() || null"
          [attr.aria-labelledby]="ariaLabelledby() || null"
          [attr.aria-describedby]="ariaDescribedby() || null"
          (change)="onChange(native)"
          (blur)="touch.emit()"
        />
        <svg class="ui-checkbox__icon" viewBox="0 0 16 16" aria-hidden="true">
          @if (indeterminate()) {
            <path d="M4 8h8" />
          } @else {
            <path d="M3.5 8.5l3 3 6-7" />
          }
        </svg>
      </span>
      <span class="ui-checkbox__text"><ng-content /></span>
    </label>
  `,
  styleUrl: './checkbox.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideUiFormValueControl(UiCheckbox)],
  host: {
    class: 'ui-checkbox',
    '[class.ui-checkbox--checked]': 'checked()',
    '[class.ui-checkbox--indeterminate]': 'indeterminate()',
    '[class.ui-checkbox--disabled]': 'isDisabled()',
    '[class.ui-checkbox--invalid]': 'showInvalid()',
  },
})
export class UiCheckbox implements FormCheckboxControl, UiFormValueControl<boolean> {
  private readonly native = viewChild.required<ElementRef<HTMLInputElement>>('native');
  private readonly state = injectUiControlState();

  /** Whether the box is checked. Two-way bindable: `[(checked)]`. */
  readonly checked = model(false);
  /**
   * Mixed state ("some of the items are selected"). Exposed to assistive tech as
   * `aria-checked="mixed"` through the native `indeterminate` property. Cleared when the user toggles.
   */
  readonly indeterminate = model(false);
  /** Disables the checkbox. Set automatically by Signal Forms and Reactive Forms. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Shows the error state. Bound automatically by Signal Forms (then displayed only after the field
   * is touched); with Reactive Forms the state is read from the `FormControl`.
   */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Marks the checkbox as required (`aria-required`). Bound automatically by Signal Forms. */
  readonly required = input(false, { transform: booleanAttribute });
  /** `name` of the native input, for native form submission. Bound automatically by Signal Forms. */
  readonly name = input('');
  /** DOM id of the native input. */
  readonly inputId = input(injectId('ui-checkbox'));
  /** Accessible name when there is no visible label content. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  /** Id(s) of the element(s) labelling the checkbox. */
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  /** Id(s) of the element(s) describing the checkbox (hint or error text). */
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  /** Emits when the native input loses focus; marks the form control as touched. */
  readonly touch = output<void>();

  /** @internal */
  readonly formModel = this.checked;

  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly isRequired = computed(() => this.required() || this.state.required());
  protected readonly showInvalid = computed(() =>
    // Signal Forms binds the raw `invalid`; show it like the other fields do, after interaction.
    this.state.source() === 'signal-forms' ? this.state.errorVisible() : this.invalid() || this.state.errorVisible(),
  );

  /** @internal Called by `UiControlValueAccessor`. */
  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  /** Focuses the native checkbox. */
  focus(options?: FocusOptions): void {
    this.native().nativeElement.focus(options);
  }

  protected onChange(input: HTMLInputElement): void {
    this.indeterminate.set(false);
    this.checked.set(input.checked);
  }
}
