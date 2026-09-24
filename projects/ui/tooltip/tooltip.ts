import { FocusMonitor } from '@angular/cdk/a11y';
import { hasModifierKey } from '@angular/cdk/keycodes';
import {
  FlexibleConnectedPositionStrategy,
  OverlayRef,
  createFlexibleConnectedPositionStrategy,
  createOverlayRef,
  createRepositionScrollStrategy,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ComponentRef,
  DestroyRef,
  Directive,
  ElementRef,
  Injector,
  Signal,
  booleanAttribute,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
  untracked,
} from '@angular/core';
import { injectId } from '@usertrv/ui/a11y';
import { UiTooltipPosition, tooltipPositions } from './positions';
import { UiTooltipPanel } from './tooltip-panel';

/**
 * Short text hint for the element it is placed on (APG tooltip pattern).
 *
 * Shows after `uiTooltipShowDelay` on mouse hover and immediately on keyboard focus (focus-visible
 * only, not on click). It stays while the pointer is over the trigger or the tooltip itself, or the
 * trigger has focus; Escape dismisses it without moving pointer or focus (WCAG 1.4.13). While shown,
 * the tooltip (`role="tooltip"`) is referenced from the trigger's `aria-describedby`.
 * Touch input does not show tooltips: never put essential information only in a tooltip.
 */
@Directive({
  selector: '[uiTooltip]',
  exportAs: 'uiTooltip',
  host: {
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'onPointerLeave()',
    '(pointerdown)': 'dismiss()',
  },
})
export class UiTooltip {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly visible = signal(false);

  /** Tooltip text. Empty or null disables the tooltip. */
  readonly text = input<string | null | undefined>('', { alias: 'uiTooltip' });
  /** Preferred side; flips to the opposite side when there is no room. */
  readonly position = input<UiTooltipPosition>('top', { alias: 'uiTooltipPosition' });
  /** Hover delay before showing, in ms. Keyboard focus shows immediately. */
  readonly showDelay = input(300, { alias: 'uiTooltipShowDelay', transform: numberAttribute });
  /** Grace period after the pointer leaves, in ms, so it can travel onto the tooltip. */
  readonly hideDelay = input(100, { alias: 'uiTooltipHideDelay', transform: numberAttribute });
  /** Disables the tooltip. It is also suppressed while the trigger is `disabled` or `aria-disabled="true"`. */
  readonly tooltipDisabled = input(false, { alias: 'uiTooltipDisabled', transform: booleanAttribute });

  /** Whether the tooltip is currently rendered. */
  readonly isOpen: Signal<boolean> = this.visible.asReadonly();
  /** Id of the tooltip element. */
  readonly tooltipId = injectId('ui-tooltip');

  private triggerHovered = false;
  private panelHovered = false;
  private keyboardFocused = false;
  /** Set by Escape / pointerdown; cleared once hover and focus have both ended. */
  private dismissed = false;
  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private overlayRef: OverlayRef | null = null;
  private positionStrategy: FlexibleConnectedPositionStrategy | null = null;
  private panelRef: ComponentRef<UiTooltipPanel> | null = null;

  constructor() {
    const focusMonitor = inject(FocusMonitor);
    const focusSub = focusMonitor.monitor(this.element).subscribe((origin) => {
      this.keyboardFocused = origin === 'keyboard';
      this.update();
    });

    effect(() => {
      const text = this.text();
      const disabled = this.tooltipDisabled();
      untracked(() => {
        if (!text || disabled) this.hide();
        else this.panelRef?.setInput('text', text);
      });
    });

    inject(DestroyRef).onDestroy(() => {
      focusSub.unsubscribe();
      focusMonitor.stopMonitoring(this.element);
      this.clearTimers();
      this.detach();
      this.overlayRef?.dispose();
    });
  }

  /** Shows the tooltip now, ignoring the delay. */
  show(): void {
    this.clearTimers();
    if (this.canShow()) this.attach();
  }

  /** Hides the tooltip now. */
  hide(): void {
    this.clearTimers();
    this.detach();
  }

  protected onPointerEnter(event: PointerEvent): void {
    if (event.pointerType === 'touch') return;
    this.triggerHovered = true;
    this.update();
  }

  protected onPointerLeave(): void {
    this.triggerHovered = false;
    this.update(true);
  }

  /** Escape, or pressing the trigger: hide until hover and focus both end. */
  protected dismiss(): void {
    this.dismissed = true;
    this.hide();
  }

  /** @param pointerLeft The pointer just left the trigger or tooltip: allow a grace period to cross the gap. */
  private update(pointerLeft = false): void {
    const engaged = this.triggerHovered || this.panelHovered || this.keyboardFocused;
    if (!engaged) this.dismissed = false;

    if (engaged && !this.dismissed && this.canShow()) {
      this.clearHideTimer();
      if (this.visible() || this.showTimer) return;
      const delay = this.keyboardFocused ? 0 : this.showDelay();
      if (delay <= 0) {
        this.attach();
      } else {
        this.showTimer = setTimeout(() => {
          this.showTimer = null;
          this.attach();
        }, delay);
      }
    } else {
      this.clearShowTimer();
      if (!this.visible() || this.hideTimer) return;
      const delay = pointerLeft ? this.hideDelay() : 0;
      if (delay <= 0) {
        this.detach();
      } else {
        this.hideTimer = setTimeout(() => {
          this.hideTimer = null;
          this.detach();
        }, delay);
      }
    }
  }

  private canShow(): boolean {
    const el = this.element;
    return (
      !!this.text() &&
      !this.tooltipDisabled() &&
      !el.hasAttribute('disabled') &&
      el.getAttribute('aria-disabled') !== 'true'
    );
  }

  private attach(): void {
    if (this.visible()) return;
    const overlayRef = (this.overlayRef ??= this.createOverlay());
    this.positionStrategy?.withPositions(tooltipPositions(this.position()));
    this.panelRef = overlayRef.attach(new ComponentPortal(UiTooltipPanel, null, this.injector));
    this.panelRef.setInput('text', this.text() ?? '');
    this.panelRef.setInput('tooltipId', this.tooltipId);
    this.panelRef.instance.hoverChange.subscribe((hovered) => {
      this.panelHovered = hovered;
      this.update(!hovered);
    });
    this.addDescribedBy();
    this.visible.set(true);
  }

  private detach(): void {
    if (!this.visible()) return;
    this.panelHovered = false;
    this.removeDescribedBy();
    this.overlayRef?.detach();
    this.panelRef = null;
    this.visible.set(false);
  }

  private createOverlay(): OverlayRef {
    const positionStrategy = (this.positionStrategy = createFlexibleConnectedPositionStrategy(this.injector, this.element)
      .withPositions(tooltipPositions(this.position()))
      .withFlexibleDimensions(false)
      .withViewportMargin(8));
    const overlayRef = createOverlayRef(this.injector, {
      positionStrategy,
      scrollStrategy: createRepositionScrollStrategy(this.injector, { scrollThrottle: 20 }),
      panelClass: ['ui-overlay-pane', 'ui-tooltip-pane'],
    });
    // Delivered only while the tooltip is the topmost overlay, so Escape does not also close a dialog below.
    overlayRef.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape' && !hasModifierKey(event)) {
        event.preventDefault();
        this.dismiss();
      }
    });
    return overlayRef;
  }

  private addDescribedBy(): void {
    const ids = this.describedByIds().filter((id) => id !== this.tooltipId);
    this.element.setAttribute('aria-describedby', [...ids, this.tooltipId].join(' '));
  }

  private removeDescribedBy(): void {
    const ids = this.describedByIds().filter((id) => id !== this.tooltipId);
    if (ids.length) this.element.setAttribute('aria-describedby', ids.join(' '));
    else this.element.removeAttribute('aria-describedby');
  }

  private describedByIds(): string[] {
    return (this.element.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
  }

  private clearTimers(): void {
    this.clearShowTimer();
    this.clearHideTimer();
  }

  private clearShowTimer(): void {
    if (this.showTimer) clearTimeout(this.showTimer);
    this.showTimer = null;
  }

  private clearHideTimer(): void {
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = null;
  }
}
