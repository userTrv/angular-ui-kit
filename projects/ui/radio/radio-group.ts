import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { injectId } from '@usertrv/ui/a11y';
import { UiFormValueControl, injectUiControlState, provideUiFormValueControl } from '@usertrv/ui/forms';

/**
 * Single choice from a short list of options, rendered as native radio buttons.
 *
 * All `ui-radio-button`s of a group share one generated `name`, so the browser implements the whole
 * WAI-ARIA radio group keyboard model: Tab enters the group at the checked option (the first one
 * if none is checked), arrow keys move **and** select, disabled options are skipped.
 *
 * Signal Forms `FormValueControl<T | null>`; use `UiControlValueAccessor` for Reactive Forms / `ngModel`.
 */
@Component({
  selector: 'ui-radio-group',
  exportAs: 'uiRadioGroup',
  template: `
    @if (label()) {
      <span class="ui-radio-group__label" [id]="labelId">{{ label() }}</span>
    }
    <div class="ui-radio-group__options"><ng-content /></div>
  `,
  styleUrl: './radio.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideUiFormValueControl(UiRadioGroup)],
  host: {
    class: 'ui-radio-group',
    role: 'radiogroup',
    '[class.ui-radio-group--horizontal]': 'orientation() === "horizontal"',
    '[class.ui-radio-group--invalid]': 'showInvalid()',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.aria-describedby]': 'ariaDescribedby() || null',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.aria-required]': 'isRequired() || null',
    '[attr.aria-invalid]': 'showInvalid() || null',
    '(focusout)': 'onFocusout($event)',
  },
})
export class UiRadioGroup<T = unknown> implements FormValueControl<T | null>, UiFormValueControl<T | null> {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly state = injectUiControlState();
  private readonly generatedName = injectId('ui-radio-group');
  protected readonly labelId = injectId('ui-radio-group-label');

  /** The selected option's value, `null` when nothing is selected. Two-way bindable: `[(value)]`. */
  readonly value = model<T | null>(null);
  /** Shared `name` of the native radios. Generated when empty; bound automatically by Signal Forms. */
  readonly name = input('');
  /** Visible group label, rendered above the options and referenced by `aria-labelledby`. */
  readonly label = input('');
  /** Layout direction. Arrow keys work in both directions either way (native radio behaviour). */
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');
  /** Disables every option. Set automatically by Signal Forms and Reactive Forms. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Shows the error state (for Signal Forms only after the field is touched). */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Marks the group as required (`aria-required`). Bound automatically by Signal Forms. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Compares option values with the selected value (default `Object.is`); useful for object values. */
  readonly compareWith = input<(a: T | null, b: T | null) => boolean>(Object.is);
  /** Accessible name when there is no visible `label`. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  /** Id(s) of external labelling element(s); used instead of the built-in `label`. */
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  /** Id(s) of hint or error text for the whole group. */
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  /** Emits when focus leaves the group; marks the form control as touched. */
  readonly touch = output<void>();

  /** @internal */
  readonly formModel = this.value;

  private readonly formDisabled = signal(false);
  /** @internal */
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  /** @internal */
  readonly groupName = computed(() => this.name() || this.generatedName);
  protected readonly isRequired = computed(() => this.required() || this.state.required());
  protected readonly showInvalid = computed(() =>
    this.state.source() === 'signal-forms' ? this.state.errorVisible() : this.invalid() || this.state.errorVisible(),
  );
  protected readonly labelledBy = computed(() => this.ariaLabelledby() || (this.label() ? this.labelId : null));

  /** @internal */
  isSelected(value: T): boolean {
    return this.compareWith()(this.value(), value);
  }

  /** @internal */
  select(value: T): void {
    if (!this.isDisabled()) this.value.set(value);
  }

  /** @internal Called by `UiControlValueAccessor`. */
  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  /** Focuses the checked option, or the first enabled one — where Tab would land. */
  focus(options?: FocusOptions): void {
    const radios = Array.from(this.host.querySelectorAll<HTMLInputElement>('input[type=radio]:not(:disabled)'));
    (radios.find((r) => r.checked) ?? radios[0])?.focus(options);
  }

  protected onFocusout(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !this.host.contains(next)) this.touch.emit();
  }
}
