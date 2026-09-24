import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import {
  DestroyRef,
  Directive,
  Injector,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  model,
  output,
  untracked,
} from '@angular/core';
import { injectId } from '@usertrv/ui/a11y';
import { UiOption, UiOptionHost } from './option';

/**
 * Who has DOM focus while the listbox is in use.
 * - `self`: the listbox is focusable and handles its own keys (a standalone listbox).
 * - `external`: focus stays on another element (a combobox input or a select trigger) that
 *   points at the listbox with `aria-controls` / `aria-activedescendant` and forwards keys to
 *   `handleKeydown()`.
 */
export type UiListboxFocusMode = 'self' | 'external';

/** Equality of two option values, e.g. `(a, b) => a.id === b.id` for objects. */
export type UiCompareWith<T> = (a: T, b: T) => boolean;

/**
 * Headless listbox (`role="listbox"`): selection, keyboard navigation and typeahead over
 * `uiOption` children, with no styles of its own.
 *
 * Navigation uses the CDK `ActiveDescendantKeyManager`: the "active" option is announced through
 * `aria-activedescendant` instead of moving DOM focus, which is what the WAI-ARIA combobox
 * pattern requires (focus must stay in the input). Selection is always an array
 * (`uiListboxSelection`); single-select components map it to one value.
 */
@Directive({
  selector: '[uiListbox]',
  exportAs: 'uiListbox',
  host: {
    role: 'listbox',
    '[id]': 'id()',
    '[attr.aria-multiselectable]': 'multiple() || null',
    '[attr.aria-disabled]': 'listboxDisabled() || null',
    '[attr.tabindex]': 'focusMode() === "self" ? (listboxDisabled() ? -1 : 0) : null',
    '[attr.aria-activedescendant]': 'focusMode() === "self" ? activeDescendantId() : null',
    '(keydown)': 'onHostKeydown($event)',
    '(focus)': 'onHostFocus()',
    '(mousedown)': 'onMousedown($event)',
  },
})
export class UiListbox<T = unknown> implements UiOptionHost<T> {
  private readonly ownOptions = contentChildren<UiOption<T>>(UiOption, { descendants: true });

  /** DOM id of the listbox, for `aria-controls` on the element that drives it. */
  readonly id = input(injectId('ui-listbox'));
  /** Selected values. Always an array; holds at most one value unless `uiListboxMultiple`. */
  readonly selection = model<readonly T[]>([], { alias: 'uiListboxSelection' });
  /** Allows several selected options (`aria-multiselectable`); picking toggles an option. */
  readonly multiple = input(false, { alias: 'uiListboxMultiple', transform: booleanAttribute });
  /** Equality used to match option values against the selection (e.g. compare objects by id). */
  readonly compareWith = input<UiCompareWith<T>>(Object.is, { alias: 'uiListboxCompareWith' });
  /**
   * Options to manage when they are not content children of the listbox element — e.g. options
   * projected into a select component and rendered inside its panel.
   */
  readonly externalOptions = input<readonly UiOption<T>[] | undefined>(undefined, { alias: 'uiListboxOptions' });
  /** See `UiListboxFocusMode`. */
  readonly focusMode = input<UiListboxFocusMode>('self', { alias: 'uiListboxFocusMode' });
  /** Whether arrow keys wrap from the last option to the first and back. */
  readonly wrap = input(false, { alias: 'uiListboxWrap', transform: booleanAttribute });
  /** Whether typing characters moves the active option to the next matching label. */
  readonly typeahead = input(true, { alias: 'uiListboxTypeahead', transform: booleanAttribute });
  /** Single-select only: selects whatever option becomes active (like a native closed `<select>`). */
  readonly selectionFollowsFocus = input(false, {
    alias: 'uiListboxSelectionFollowsFocus',
    transform: booleanAttribute,
  });
  /** Disables picking and keyboard navigation. */
  readonly listboxDisabled = input(false, { alias: 'uiListboxDisabled', transform: booleanAttribute });

  /** Emitted when the user picks an option (click, Enter, Space), even if it was already selected. */
  readonly picked = output<UiOption<T>>({ alias: 'uiListboxPicked' });

  /** The options the listbox manages, in DOM order. */
  readonly options = computed<readonly UiOption<T>[]>(() => this.externalOptions() ?? this.ownOptions());
  /** The active option (the one `aria-activedescendant` points at), if any. */
  readonly activeOption = computed(() => this.options().find((o) => o.active()) ?? null);
  /** Id of the active option, for `aria-activedescendant` on the focused element. */
  readonly activeDescendantId = computed(() => this.activeOption()?.id ?? null);

  private readonly keyManager = new ActiveDescendantKeyManager<UiOption<T>>(
    this.options,
    inject(Injector),
  )
    .withVerticalOrientation()
    .withHomeAndEnd()
    .withPageUpDown()
    .withTypeAhead()
    .skipPredicate((option) => option.isDisabled());
  /** Whether the current active-option change comes from the keyboard (not from code). */
  private navigating = false;
  private typeaheadPending = false;

  constructor() {
    effect(() => {
      for (const option of this.options()) option._setHost(this);
    });
    effect(() => this.keyManager.withWrap(this.wrap()));
    // An active option that left the list (filtered out, re-rendered) must not stay referenced.
    effect(() => {
      const options = this.options();
      untracked(() => {
        const active = this.keyManager.activeItem;
        if (active && !options.includes(active)) {
          active.setInactiveStyles();
          this.keyManager.updateActiveItem(-1);
        }
      });
    });
    const changes = this.keyManager.change.subscribe(() => {
      const byUser = this.navigating || this.typeaheadPending;
      this.typeaheadPending = false;
      const active = this.keyManager.activeItem;
      if (!byUser || !active || !this.selectionFollowsFocus() || this.multiple()) return;
      if (!this.isSelected(active.value())) this.selection.set([active.value()]);
    });
    inject(DestroyRef).onDestroy(() => {
      changes.unsubscribe();
      this.keyManager.destroy();
    });
  }

  /** Whether `value` is part of the selection (using `compareWith`). */
  isSelected(value: T): boolean {
    const compare = this.compareWith();
    return this.selection().some((selected) => compare(selected, value));
  }

  /**
   * Handles navigation keys: arrows, Home/End, PageUp/PageDown and (if enabled) typeahead
   * characters. Does not pick — call `pickActive()` for Enter/Space. Use it from the element
   * that keeps focus when `uiListboxFocusMode="external"`.
   */
  handleKeydown(event: KeyboardEvent): void {
    if (this.listboxDisabled()) return;
    const isCharacter = event.key.length === 1;
    if (isCharacter && !this.typeahead()) return;
    // CDK typeahead moves the active option after a debounce, outside this call.
    if (isCharacter) this.typeaheadPending = true;
    this.navigating = true;
    try {
      this.keyManager.onKeydown(event);
    } finally {
      this.navigating = false;
    }
  }

  /** Whether a typeahead sequence is in progress (so Space should be treated as a character). */
  isTyping(): boolean {
    return this.keyManager.isTyping();
  }

  /** Picks `option`: selects it (single) or toggles it (multiple), then emits `uiListboxPicked`. */
  pickOption(option: UiOption<T>): void {
    if (option.isDisabled() || this.listboxDisabled()) return;
    const value = option.value();
    if (this.multiple()) {
      const compare = this.compareWith();
      const current = this.selection();
      this.selection.set(
        this.isSelected(value) ? current.filter((v) => !compare(v, value)) : [...current, value],
      );
    } else if (!this.isSelected(value) || this.selection().length !== 1) {
      this.selection.set([value]);
    }
    this.setActiveOption(option);
    this.picked.emit(option);
  }

  /** Picks the active option. Returns false when there is none. */
  pickActive(): boolean {
    const active = this.activeOption();
    if (!active) return false;
    this.pickOption(active);
    return true;
  }

  /** Makes `option` the active descendant (or clears it with `null`). */
  setActiveOption(option: UiOption<T> | null): void {
    if (!option) {
      this.keyManager.activeItem?.setInactiveStyles();
      this.keyManager.updateActiveItem(-1);
      return;
    }
    this.keyManager.setActiveItem(option);
  }

  /**
   * Moves the active option to the first selected one, or to `fallback` when nothing is selected
   * (APG: opening a listbox highlights the current value).
   */
  setActiveToSelected(fallback: 'first' | 'last' | 'none' = 'first'): void {
    const selected = this.options().find((o) => o.selected() && !o.isDisabled());
    if (selected) this.setActiveOption(selected);
    else if (fallback === 'first') this.keyManager.setFirstItemActive();
    else if (fallback === 'last') this.keyManager.setLastItemActive();
    else this.setActiveOption(null);
  }

  /** Makes the first enabled option active. */
  setFirstActive(): void {
    this.keyManager.setFirstItemActive();
  }

  /** Makes the last enabled option active. */
  setLastActive(): void {
    this.keyManager.setLastItemActive();
  }

  protected onHostKeydown(event: KeyboardEvent): void {
    if (this.focusMode() !== 'self') return;
    const isSpace = event.key === ' ' && !this.isTyping();
    if (event.key === 'Enter' || isSpace) {
      if (this.pickActive()) event.preventDefault();
      return;
    }
    this.handleKeydown(event);
  }

  protected onHostFocus(): void {
    if (this.focusMode() === 'self' && !this.activeOption()) this.setActiveToSelected();
  }

  protected onMousedown(event: MouseEvent): void {
    // Keep DOM focus on the combobox input / select trigger when an option is clicked.
    if (this.focusMode() === 'external') event.preventDefault();
  }
}
