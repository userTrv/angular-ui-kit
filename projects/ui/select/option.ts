import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, input } from '@angular/core';
import { UiOption, UiOptionGroup } from '@usertrv/ui/listbox';

/**
 * Styled option for `ui-select` and `ui-combobox`: the headless `uiOption` directive (as a host
 * directive) plus a check mark and arbitrary projected content.
 *
 * ```html
 * <ui-option [value]="country" [label]="country.name">
 *   <img [src]="country.flag" alt="" /> {{ country.name }}
 * </ui-option>
 * ```
 */
@Component({
  selector: 'ui-option',
  hostDirectives: [
    { directive: UiOption, inputs: ['uiOption: value', 'uiOptionDisabled: disabled', 'uiOptionLabel: label'] },
  ],
  template: `
    <svg class="ui-option__check" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span class="ui-option__content"><ng-content /></span>
  `,
  styleUrl: './option.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-option' },
})
export class UiSelectOption {}

/**
 * Labelled group of `ui-option`s (`role="group"`, `aria-labelledby` its visible label).
 * `disabled` disables every option in the group.
 */
@Component({
  selector: 'ui-optgroup',
  hostDirectives: [{ directive: UiOptionGroup, inputs: ['uiOptionGroupDisabled: disabled'] }],
  template: `
    <div class="ui-optgroup__label" role="presentation" [id]="group.labelId">{{ label() }}</div>
    <ng-content />
  `,
  styleUrl: './option.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-optgroup' },
})
export class UiSelectOptionGroup {
  protected readonly group = inject(UiOptionGroup);
  /** Visible group label. */
  readonly label = input.required<string>();
}
