import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { injectId } from '@usertrv/ui/a11y';
import { UiRadioGroup } from './radio-group';

/**
 * One option of a `ui-radio-group`: a native `<input type="radio">` with a custom visual,
 * labelled by the projected content.
 */
@Component({
  selector: 'ui-radio-button',
  template: `
    <label class="ui-radio__label">
      <span class="ui-radio__control">
        <input
          type="radio"
          class="ui-radio__input"
          [id]="inputId()"
          [name]="group.groupName()"
          [attr.value]="nativeValue()"
          [checked]="checked()"
          [disabled]="isDisabled()"
          [attr.aria-describedby]="ariaDescribedby() || null"
          (change)="group.select(value())"
        />
        <span class="ui-radio__circle" aria-hidden="true"></span>
      </span>
      <span class="ui-radio__text"><ng-content /></span>
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-radio',
    '[class.ui-radio--checked]': 'checked()',
    '[class.ui-radio--disabled]': 'isDisabled()',
  },
})
export class UiRadioButton<T = unknown> {
  protected readonly group = inject<UiRadioGroup<T>>(UiRadioGroup);

  /** The value the group takes when this option is selected. */
  readonly value = input.required<T>();
  /** Disables only this option; arrow keys skip it. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** DOM id of the native radio. */
  readonly inputId = input(injectId('ui-radio'));
  /** Id(s) of text describing this option (e.g. a price or a note). */
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  /** Whether this option is the selected one. */
  readonly checked = computed(() => this.group.isSelected(this.value()));
  protected readonly isDisabled = computed(() => this.disabled() || this.group.isDisabled());
  /** Native form submission only understands strings. */
  protected readonly nativeValue = computed(() => {
    const value = this.value();
    return typeof value === 'string' || typeof value === 'number' ? String(value) : null;
  });
}
