import { Directionality } from '@angular/cdk/bidi';
import {
  OverlayRef,
  createFlexibleConnectedPositionStrategy,
  createOverlayRef,
  createRepositionScrollStrategy,
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { DestroyRef, Injector, TemplateRef, ViewContainerRef, afterNextRender, inject, signal } from '@angular/core';

/**
 * @internal Shared popup behaviour of `ui-datepicker` and `ui-date-range-picker`: renders a
 * template in a CDK overlay anchored to the field, moves focus into the calendar grid once it is
 * rendered, closes on outside pointer events and restores focus to the toggle button.
 *
 * Must be constructed in an injection context (a component field initializer).
 */
export class DatepickerPopup {
  private readonly injector = inject(Injector);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly dir = inject(Directionality, { optional: true });
  private overlayRef: OverlayRef | null = null;
  private readonly opened = signal(false);

  /** Whether the popup is currently open. */
  readonly isOpen = this.opened.asReadonly();

  constructor(
    private readonly options: {
      /** Element the popup is positioned against (the field wrapper). */
      origin: () => HTMLElement;
      /** Button that opens the popup; focus returns here on close. */
      toggle: () => HTMLElement | undefined;
      /** Content of the popup (a `role="dialog"` element containing a `ui-calendar`). */
      template: () => TemplateRef<unknown>;
      /** Called after the popup closed, for any reason. */
      closed: () => void;
    },
  ) {
    inject(DestroyRef).onDestroy(() => this.dispose());
  }

  open(): void {
    if (this.overlayRef) return;
    const origin = this.options.origin();
    const positionStrategy = createFlexibleConnectedPositionStrategy(this.injector, origin)
      .withFlexibleDimensions(false)
      .withPush(false)
      .withViewportMargin(8)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
        { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
        { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 },
      ]);
    const overlayRef = createOverlayRef(this.injector, {
      positionStrategy,
      scrollStrategy: createRepositionScrollStrategy(this.injector),
      panelClass: 'ui-overlay-pane',
      direction: this.dir?.value ?? 'ltr',
    });
    overlayRef.attach(new TemplatePortal(this.options.template(), this.viewContainerRef));
    overlayRef.outsidePointerEvents().subscribe((event) => {
      // Clicks on the field itself (e.g. the toggle) are handled by the field.
      if (!origin.contains(event.target as Node)) this.close(false);
    });
    this.overlayRef = overlayRef;
    this.opened.set(true);
    afterNextRender(
      { write: () => overlayRef.overlayElement.querySelector<HTMLElement>('.ui-calendar__cell[tabindex="0"]')?.focus() },
      { injector: this.injector },
    );
  }

  /** Closes the popup; by default returns focus to the toggle button (APG dialog behaviour). */
  close(restoreFocus = true): void {
    if (!this.overlayRef) return;
    this.dispose();
    if (restoreFocus) this.options.toggle()?.focus();
    this.options.closed();
  }

  private dispose(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.opened.set(false);
  }
}
