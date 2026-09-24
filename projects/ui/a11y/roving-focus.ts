import { FocusKeyManager, FocusableOption } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import {
  DestroyRef,
  Directive,
  ElementRef,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';

export type UiOrientation = 'horizontal' | 'vertical';

/**
 * One focusable item inside a `uiRovingFocusGroup`. Only the active item is in the tab order
 * (`tabindex="0"`), every other item gets `tabindex="-1"` — the WAI-ARIA "roving tabindex" technique.
 */
@Directive({
  selector: '[uiRovingFocusItem]',
  host: {
    '[attr.tabindex]': 'tabIndex()',
    '(focus)': 'group.onItemFocused(this)',
  },
})
export class UiRovingFocusItem implements FocusableOption {
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly group = inject(UiRovingFocusGroup);
  private readonly active = signal(false);

  /**
   * Skipped by arrow keys when true. (Named `itemDisabled` because CDK's `FocusableOption`
   * reserves `disabled` for a plain boolean.)
   */
  readonly itemDisabled = input(false, { alias: 'uiRovingFocusItemDisabled', transform: booleanAttribute });

  protected readonly tabIndex = computed(() => (this.active() ? 0 : -1));

  /** @internal */
  setActive(active: boolean): void {
    this.active.set(active);
  }

  focus(): void {
    this.element.focus();
  }

  getLabel(): string {
    return this.element.textContent?.trim() ?? '';
  }
}

/**
 * Manages arrow-key navigation between `uiRovingFocusItem`s (built on CDK `FocusKeyManager`):
 * arrows move focus, Home/End jump to the ends, typing a character focuses the next item that starts
 * with it. Used by radio group, tabs and pagination; exported for custom composite widgets.
 */
@Directive({
  selector: '[uiRovingFocusGroup]',
  exportAs: 'uiRovingFocusGroup',
  host: { '(keydown)': 'onKeydown($event)' },
})
export class UiRovingFocusGroup {
  /** Which arrow keys move focus. */
  readonly orientation = input<UiOrientation>('horizontal', { alias: 'uiRovingFocusGroup' });
  /** Whether focus wraps from the last item to the first and back. */
  readonly wrap = input(true, { alias: 'uiRovingFocusWrap', transform: booleanAttribute });

  private readonly items = contentChildren(UiRovingFocusItem, { descendants: true });
  private readonly dir = inject(Directionality, { optional: true });
  private keyManager?: FocusKeyManager<UiRovingFocusItem>;

  constructor() {
    effect(() => {
      const items = this.items();
      const orientation = this.orientation();
      const wrap = this.wrap();
      untracked(() => this.setupKeyManager(items, orientation, wrap));
    });
    inject(DestroyRef).onDestroy(() => this.keyManager?.destroy());
  }

  /** Makes `item` the tab stop without moving focus (e.g. when selection changes programmatically). */
  setActiveItem(item: UiRovingFocusItem): void {
    this.keyManager?.updateActiveItem(item);
    this.syncTabStops();
  }

  /** @internal */
  onItemFocused(item: UiRovingFocusItem): void {
    if (this.keyManager?.activeItem !== item) this.setActiveItem(item);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const manager = this.keyManager;
    if (!manager) return;
    const before = manager.activeItem;
    manager.onKeydown(event);
    if (manager.activeItem !== before) this.syncTabStops();
  }

  private setupKeyManager(items: readonly UiRovingFocusItem[], orientation: UiOrientation, wrap: boolean) {
    const previous = this.keyManager?.activeItem;
    this.keyManager?.destroy();
    const manager = new FocusKeyManager<UiRovingFocusItem>([...items])
      .withWrap(wrap)
      .withHomeAndEnd()
      .withTypeAhead()
      .skipPredicate((item) => item.itemDisabled());
    if (orientation === 'horizontal') {
      manager.withHorizontalOrientation(this.dir?.value ?? 'ltr').withVerticalOrientation(false);
    } else {
      manager.withVerticalOrientation(true).withHorizontalOrientation(null);
    }
    this.keyManager = manager;
    const initial = previous && items.includes(previous) ? previous : items.find((i) => !i.itemDisabled());
    if (initial) manager.updateActiveItem(initial);
    this.syncTabStops();
  }

  private syncTabStops(): void {
    const active = this.keyManager?.activeItem;
    for (const item of this.items()) item.setActive(item === active);
  }
}
