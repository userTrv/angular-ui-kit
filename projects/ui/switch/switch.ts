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
 * On/off switch for settings that apply immediately. Built on `<input type="checkbox" role="switch">`:
 * the browser supplies focus, Space to toggle, the label click and form participation; `role="switch"`
 * makes screen readers announce "on/off" instead of "checked/not checked".
 *
 * Signal Forms `FormCheckboxControl`; use `UiControlValueAccessor` for Reactive Forms / `ngModel`.
 */
@Component({
  selector: 'ui-switch',
  exportAs: 'uiSwitch',
  template: `
    <label class="ui-switch__label">
      <span class="ui-switch__control">
        <input
          #native
          type="checkbox"
          role="switch"
          class="ui-switch__input"
          [id]="inputId()"
          [checked]="checked()"
          [disabled]="isDisabled()"
          [attr.name]="name() || null"
          [attr.aria-invalid]="showInvalid() || null"
          [attr.aria-required]="isRequired() || null"
          [attr.aria-label]="ariaLabel() || null"
          [attr.aria-describedby]="describedBy()"
          (change)="checked.set(native.checked)"
          (blur)="touch.emit()"
        />
        <span class="ui-switch__track" aria-hidden="true"><span class="ui-switch__thumb"></span></span>
      </span>
      <span class="ui-switch__text"><ng-content /></span>
    </label>
    @if (description()) {
      <span class="ui-switch__description" [id]="descriptionId">{{ description() }}</span>
    }
  `,
  styleUrl: './switch.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideUiFormValueControl(UiSwitch)],
  host: {
    class: 'ui-switch',
    '[class.ui-switch--checked]': 'checked()',
    '[class.ui-switch--disabled]': 'isDisabled()',
    '[class.ui-switch--invalid]': 'showInvalid()',
    '[class.ui-switch--label-before]': 'labelPosition() === "before"',
  },
})
export class UiSwitch implements FormCheckboxControl, UiFormValueControl<boolean> {
  private readonly native = viewChild.required<ElementRef<HTMLInputElement>>('native');
  private readonly state = injectUiControlState();
  protected readonly descriptionId = injectId('ui-switch-description');

  /** Whether the switch is on. Two-way bindable: `[(checked)]`. */
  readonly checked = model(false);
  /** Secondary text under the label, linked with `aria-describedby` (not part of the name). */
  readonly description = input('');
  /** Which side of the track the label sits on. */
  readonly labelPosition = input<'before' | 'after'>('after');
  /** Disables the switch. Set automatically by Signal Forms and Reactive Forms. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Shows the error state (for Signal Forms only after the field is touched). */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Marks the switch as required (`aria-required`), e.g. a consent that must be on. */
  readonly required = input(false, { transform: booleanAttribute });
  /** `name` of the native input. Bound automatically by Signal Forms. */
  readonly name = input('');
  /** DOM id of the native input. */
  readonly inputId = input(injectId('ui-switch'));
  /** Accessible name when there is no visible label content. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  /** Extra ids for `aria-describedby`, merged with the description. */
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  /** Emits when the switch loses focus; marks the form control as touched. */
  readonly touch = output<void>();

  /** @internal */
  readonly formModel = this.checked;

  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly isRequired = computed(() => this.required() || this.state.required());
  protected readonly showInvalid = computed(() =>
    this.state.source() === 'signal-forms' ? this.state.errorVisible() : this.invalid() || this.state.errorVisible(),
  );
  protected readonly describedBy = computed(() => {
    const ids = [this.description() ? this.descriptionId : '', this.ariaDescribedby()].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  });

  /** @internal Called by `UiControlValueAccessor`. */
  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  /** Focuses the switch. */
  focus(options?: FocusOptions): void {
    this.native().nativeElement.focus(options);
  }

  /** Flips the state, as a user click would. */
  toggle(): void {
    if (!this.isDisabled()) this.checked.update((on) => !on);
  }
}
