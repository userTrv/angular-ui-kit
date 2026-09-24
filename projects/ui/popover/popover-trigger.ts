import { FocusMonitor } from '@angular/cdk/a11y';
import { hasModifierKey } from '@angular/cdk/keycodes';
import {
  FlexibleConnectedPositionStrategy,
  OverlayRef,
  createFlexibleConnectedPositionStrategy,
  createOverlayRef,
  createRepositionScrollStrategy,
} from '@angular/cdk/overlay';
import { _getFocusedElementPierceShadowDom } from '@angular/cdk/platform';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ComponentRef,
  DestroyRef,
  Directive,
  ElementRef,
  Injector,
  effect,
  inject,
  input,
  model,
  output,
  untracked,
} from '@angular/core';
import { UI_POPOVER_CONTROL, UiPopover, UiPopoverControl } from './popover';
import { UiPopoverPanel } from './popover-panel';
import { UiPopoverPosition, popoverPositions } from './positions';
import { tabbableElements } from './tabbable';

/**
 * Where focus goes when the popover opens: the first tabbable element (default), the panel itself
 * (useful when the content starts with text to read), or nowhere (`none`: focus stays on the
 * trigger and Tab moves into the panel).
 */
export type UiPopoverAutoFocus = 'first-tabbable' | 'panel' | 'none';

/** Why a popover closed. */
export type UiPopoverCloseReason = 'trigger' | 'escape' | 'outside' | 'tab' | 'close' | 'program';

/**
 * Opens a `uiPopover` template as a non-modal dialog anchored to this element (usually a button).
 *
 * Click toggles; Escape, a click outside, `uiPopoverClose`, and tabbing past either end of the
 * panel close it. Focus returns to the trigger unless the user already moved it elsewhere.
 * The trigger carries `aria-haspopup="dialog"`, `aria-expanded` and, while open, `aria-controls`.
 */
@Directive({
  selector: '[uiPopoverTrigger]',
  exportAs: 'uiPopoverTrigger',
  host: {
    'aria-haspopup': 'dialog',
    '[attr.aria-expanded]': 'opened()',
    '[attr.aria-controls]': 'opened() ? popover().panelId : null',
    '(click)': 'toggle()',
    '(keydown)': 'onTriggerKeydown($event)',
  },
})
export class UiPopoverTrigger implements UiPopoverControl {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly focusMonitor = inject(FocusMonitor);

  /** The popover to open. */
  readonly popover = input.required<UiPopover>({ alias: 'uiPopoverTrigger' });
  /** Preferred side; flips when there is no room. */
  readonly position = input<UiPopoverPosition>('bottom', { alias: 'uiPopoverPosition' });
  /** Initial focus on open. */
  readonly autoFocus = input<UiPopoverAutoFocus>('first-tabbable', { alias: 'uiPopoverAutoFocus' });
  /** Open state; supports two-way binding `[(uiPopoverOpen)]`. */
  readonly opened = model(false, { alias: 'uiPopoverOpen' });
  /** Emits after the popover closed, with the reason. */
  readonly uiPopoverClosed = output<UiPopoverCloseReason>();

  private overlayRef: OverlayRef | null = null;
  private positionStrategy: FlexibleConnectedPositionStrategy | null = null;
  private panelRef: ComponentRef<UiPopoverPanel> | null = null;

  constructor() {
    // Keeps the overlay in sync when the open state is changed through the two-way binding.
    effect(() => {
      const open = this.opened();
      untracked(() => (open ? this.attach() : this.hide('program')));
    });
    inject(DestroyRef).onDestroy(() => this.overlayRef?.dispose());
  }

  /** Opens the popover. */
  show(): void {
    this.opened.set(true);
    this.attach();
  }

  /**
   * Closes the popover.
   * @param reason Reported through `uiPopoverClosed`; decides whether focus returns to the trigger.
   */
  hide(reason: UiPopoverCloseReason = 'program'): void {
    this.opened.set(false);
    if (!this.panelRef) return;
    const panel = this.panelRef.instance.element;
    const active = _getFocusedElementPierceShadowDom();
    const focusWasInside = !!active && panel.contains(active);
    this.overlayRef?.detach();
    this.panelRef = null;

    const restore =
      reason === 'escape' || reason === 'tab' || reason === 'close' ||
      ((reason === 'outside' || reason === 'program') && (focusWasInside || !active || active === panel.ownerDocument.body));
    if (restore) this.focusMonitor.focusVia(this.element, reason === 'outside' ? 'program' : 'keyboard');
    this.uiPopoverClosed.emit(reason);
  }

  /** Opens when closed, closes when open. */
  toggle(): void {
    if (this.opened()) this.hide('trigger');
    else this.show();
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    // With autoFocus "none" the panel is not next in the tab order (it lives in the overlay container).
    if (event.key !== 'Tab' || event.shiftKey || !this.panelRef || hasModifierKey(event)) return;
    event.preventDefault();
    const panel = this.panelRef.instance.element;
    (tabbableElements(panel)[0] ?? panel).focus();
  }

  private attach(): void {
    if (this.panelRef) return;
    const overlayRef = (this.overlayRef ??= this.createOverlay());
    this.positionStrategy?.withPositions(popoverPositions(this.position()));

    const contentInjector = Injector.create({
      parent: this.injector,
      providers: [{ provide: UI_POPOVER_CONTROL, useValue: this }],
    });
    const panelRef = overlayRef.attach(new ComponentPortal(UiPopoverPanel, null, this.injector));
    panelRef.setInput('popover', this.popover());
    panelRef.setInput('contentInjector', contentInjector);
    panelRef.instance.tabOut.subscribe(() => this.hide('tab'));
    panelRef.changeDetectorRef.detectChanges();
    this.panelRef = panelRef;
    this.opened.set(true);

    const panel = panelRef.instance.element;
    const mode = this.autoFocus();
    if (mode === 'first-tabbable') (tabbableElements(panel)[0] ?? panel).focus();
    else if (mode === 'panel') panel.focus();
  }

  private createOverlay(): OverlayRef {
    const positionStrategy = (this.positionStrategy = createFlexibleConnectedPositionStrategy(this.injector, this.element)
      .withPositions(popoverPositions(this.position()))
      .withViewportMargin(8)
      .withPush(false));
    const overlayRef = createOverlayRef(this.injector, {
      positionStrategy,
      scrollStrategy: createRepositionScrollStrategy(this.injector),
      panelClass: ['ui-overlay-pane', 'ui-popover-pane'],
    });
    overlayRef.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape' && !hasModifierKey(event)) {
        event.preventDefault();
        this.hide('escape');
      }
    });
    overlayRef.outsidePointerEvents().subscribe((event) => {
      const target = event.target as Node | null;
      if (target && this.element.contains(target)) return; // the trigger's own click toggles
      this.hide('outside');
    });
    return overlayRef;
  }
}
