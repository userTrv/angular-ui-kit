import { Highlightable } from '@angular/cdk/a11y';
import { Directive, ElementRef, booleanAttribute, computed, inject, input, signal } from '@angular/core';
import { injectId } from '@usertrv/ui/a11y';

/**
 * What an option needs from the listbox that owns it. Kept as an interface so options do not
 * import the listbox class (and so a listbox can adopt options projected from elsewhere).
 * @internal
 */
export interface UiOptionHost<T> {
  isSelected(value: T): boolean;
  pickOption(option: UiOption<T>): void;
}

/**
 * Groups options under a label (`role="group"`). Put `[id]="group.labelId"` on the element that
 * holds the visible label. Disabling the group disables every option inside it.
 *
 * ```html
 * <div uiOptionGroup #fruit="uiOptionGroup">
 *   <div role="presentation" [id]="fruit.labelId">Fruit</div>
 *   <div uiOption="apple">Apple</div>
 * </div>
 * ```
 */
@Directive({
  selector: '[uiOptionGroup]',
  exportAs: 'uiOptionGroup',
  host: {
    role: 'group',
    '[attr.aria-labelledby]': 'labelId',
    '[attr.aria-disabled]': 'groupDisabled() || null',
  },
})
export class UiOptionGroup {
  /** Id to put on the group's visible label; the group is `aria-labelledby` it. */
  readonly labelId = injectId('ui-optgroup-label');
  /** Disables every option in the group. */
  readonly groupDisabled = input(false, { alias: 'uiOptionGroupDisabled', transform: booleanAttribute });
}

/**
 * One option of a `uiListbox` (`role="option"`). Headless: it exposes its state as
 * `aria-selected` / `aria-disabled` and `data-active`, and leaves the visuals to you.
 *
 * Implements CDK `Highlightable`, so the listbox's `ActiveDescendantKeyManager` can move the
 * active ("virtually focused") option while real focus stays on the listbox, a combobox input or
 * a select trigger.
 */
@Directive({
  selector: '[uiOption]',
  exportAs: 'uiOption',
  host: {
    role: 'option',
    '[id]': 'id',
    '[attr.aria-selected]': 'selected()',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.data-active]': 'active() || null',
    '(click)': 'onClick()',
  },
})
export class UiOption<T = unknown> implements Highlightable {
  /** The option element. */
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly group = inject(UiOptionGroup, { optional: true });
  private readonly host = signal<UiOptionHost<T> | null>(null);
  private readonly activeState = signal(false);

  /** DOM id, referenced by `aria-activedescendant` while the option is active. */
  readonly id = injectId('ui-option');
  /** The value this option stands for. */
  readonly value = input.required<T>({ alias: 'uiOption' });
  /**
   * Skipped by keyboard navigation and cannot be picked. (Not named `disabled`: CDK's
   * `ListKeyOption` reserves that name for a plain boolean.)
   */
  readonly optionDisabled = input(false, { alias: 'uiOptionDisabled', transform: booleanAttribute });
  /** Text used for typeahead and for the select trigger. Defaults to the option's text content. */
  readonly label = input<string | undefined>(undefined, { alias: 'uiOptionLabel' });

  /** Whether the option or its group is disabled. */
  readonly isDisabled = computed(() => this.optionDisabled() || (this.group?.groupDisabled() ?? false));
  /** Whether the option's value is part of the listbox selection. */
  readonly selected = computed(() => this.host()?.isSelected(this.value()) ?? false);
  /** Whether the option is the active descendant (keyboard "virtual focus"). */
  readonly active = this.activeState.asReadonly();

  /** @internal Called by the owning listbox. */
  _setHost(host: UiOptionHost<T>): void {
    if (this.host() !== host) this.host.set(host);
  }

  /** Label used for typeahead and display. */
  getLabel(): string {
    return this.label() ?? this.element.textContent?.trim() ?? '';
  }

  /** @internal Highlightable: called by the key manager. */
  setActiveStyles(): void {
    this.activeState.set(true);
    // jsdom has no scrollIntoView; real browsers keep the active option visible in a scrolled panel.
    this.element.scrollIntoView?.({ block: 'nearest' });
  }

  /** @internal Highlightable: called by the key manager. */
  setInactiveStyles(): void {
    this.activeState.set(false);
  }

  protected onClick(): void {
    if (!this.isDisabled()) this.host()?.pickOption(this);
  }
}
