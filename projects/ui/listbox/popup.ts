import {
  ConnectedPosition,
  OverlayRef,
  createFlexibleConnectedPositionStrategy,
  createOverlayRef,
  createRepositionScrollStrategy,
} from '@angular/cdk/overlay';
import { DomPortal } from '@angular/cdk/portal';
import { DestroyRef, Injector, Signal, signal } from '@angular/core';
import { Subscription } from 'rxjs';

/** Options for `createListboxPopup`. */
export interface UiListboxPopupConfig {
  /** Element the panel is anchored to; the panel matches its width. */
  origin: HTMLElement;
  /**
   * Element shown in the overlay while open. It is moved (CDK `DomPortal`), not re-created, so the
   * listbox inside keeps its state and its id — `aria-controls` stays valid while closed.
   */
  panel: HTMLElement;
  /** Called on a pointer press outside both the origin and the panel. */
  outsideClick?: () => void;
  /** Extra classes for the overlay pane (in addition to `ui-overlay-pane`). */
  panelClass?: string[];
}

/** A dropdown panel handle returned by `createListboxPopup`. */
export interface UiListboxPopup {
  /** Whether the panel is currently shown. */
  readonly isOpen: Signal<boolean>;
  /** Shows the panel under the origin (above it when there is no room below). */
  open(): void;
  /** Hides the panel and returns it to its original place in the DOM. */
  close(): void;
  /** Re-measures the origin and repositions the panel (e.g. after the results changed). */
  updatePosition(): void;
}

const POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
];

/**
 * Creates the dropdown behaviour shared by select and combobox on top of the CDK overlay:
 * connected position that flips above the origin when there is no space below, pane width equal
 * to the origin, repositioning on scroll, outside-click detection. The overlay is created lazily
 * on first open and disposed with the injector's `DestroyRef`. Must be given an element injector.
 */
export function createListboxPopup(injector: Injector, config: UiListboxPopupConfig): UiListboxPopup {
  const isOpen = signal(false);
  let overlayRef: OverlayRef | null = null;
  let outside = Subscription.EMPTY;

  const ensureOverlay = (): OverlayRef =>
    (overlayRef ??= createOverlayRef(injector, {
      positionStrategy: createFlexibleConnectedPositionStrategy(injector, config.origin)
        .withPositions(POSITIONS)
        .withFlexibleDimensions(false)
        .withPush(false)
        .withViewportMargin(8),
      scrollStrategy: createRepositionScrollStrategy(injector),
      panelClass: ['ui-overlay-pane', ...(config.panelClass ?? [])],
    }));

  const close = (): void => {
    if (!isOpen()) return;
    outside.unsubscribe();
    overlayRef?.detach();
    isOpen.set(false);
  };

  injector.get(DestroyRef).onDestroy(() => {
    close();
    overlayRef?.dispose();
  });

  return {
    isOpen: isOpen.asReadonly(),
    open() {
      if (isOpen()) return;
      const ref = ensureOverlay();
      ref.updateSize({ width: config.origin.getBoundingClientRect().width || undefined });
      ref.attach(new DomPortal(config.panel));
      outside = ref.outsidePointerEvents().subscribe((event) => {
        const target = event.target as Node | null;
        if (target && config.origin.contains(target)) return;
        config.outsideClick?.();
      });
      isOpen.set(true);
    },
    close,
    updatePosition() {
      overlayRef?.updatePosition();
    },
  };
}
