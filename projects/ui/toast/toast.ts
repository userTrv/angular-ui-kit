import { OverlayRef, createOverlayRef } from '@angular/cdk/overlay';
import { _getFocusedElementPierceShadowDom } from '@angular/cdk/platform';
import { ComponentPortal } from '@angular/cdk/portal';
import { Injectable, Injector, Signal, inject, runInInjectionContext } from '@angular/core';
import { injectId } from '@usertrv/ui/a11y';
import { UI_TOAST_CONFIG, UiToastDismissReason, UiToastOptions } from './toast-config';
import { UiToastItem, UiToastStore } from './toast-store';
import { UiToaster } from './toaster';

/** Handle to a shown (or queued) toast. */
export interface UiToastRef {
  /** Toast id. */
  readonly id: string;
  /** Removes the toast (or takes it out of the queue). */
  dismiss(): void;
  /** Resolves when the toast goes away, with the reason. */
  readonly dismissed: Promise<UiToastDismissReason>;
}

/**
 * Shows brief, non-modal status messages.
 *
 * At most `maxVisible` toasts are on screen; the rest wait in a queue. Each toast is announced
 * through CDK `LiveAnnouncer` when it appears (politely, assertively for `danger`) and never takes
 * focus. Countdowns pause while the toaster is hovered or has focus and resume with the remaining time.
 */
@Injectable({ providedIn: 'root' })
export class UiToast {
  private readonly store = inject(UiToastStore);
  private readonly config = inject(UI_TOAST_CONFIG);
  private readonly injector = inject(Injector);
  private overlayRef: OverlayRef | null = null;

  /** Toasts on screen, oldest first. */
  readonly visible: Signal<readonly UiToastItem[]> = this.store.visible;
  /** Number of toasts waiting for a free slot. */
  readonly queued: Signal<number> = this.store.queued;

  /**
   * Shows a toast, or queues it when `maxVisible` toasts are already on screen.
   * @param options Title, message, variant, duration and optional action.
   */
  show(options: UiToastOptions): UiToastRef {
    const id = runInInjectionContext(this.injector, () => injectId('ui-toast'));
    const item: UiToastItem = {
      id,
      title: options.title,
      message: options.message,
      variant: options.variant ?? 'info',
      action: options.action,
    };
    const duration = options.duration ?? (options.action ? this.config.duration * 2 : this.config.duration);
    this.ensureToaster();
    const dismissed = this.store.add(item, duration);
    return { id, dismissed, dismiss: () => this.store.dismiss(id, 'program') };
  }

  /**
   * Removes a toast by id.
   * @param id Id from `UiToastRef.id`.
   */
  dismiss(id: string): void {
    this.store.dismiss(id, 'program');
  }

  /** Removes every visible and queued toast. */
  dismissAll(): void {
    this.store.dismissAll();
  }

  /** Mounts a toaster in the overlay container unless the app placed `<ui-toaster>` itself. */
  private ensureToaster(): void {
    if (this.store.toasters > 0 && !this.overlayRef) return;
    if (!this.overlayRef) {
      this.overlayRef = createOverlayRef(this.injector, { panelClass: 'ui-toaster-pane' });
      this.overlayRef.attach(new ComponentPortal(UiToaster, null, this.injector));
      return;
    }
    // Native popovers stack in show order: re-show so toasts raised during a modal appear above its backdrop.
    const host = this.overlayRef.hostElement;
    const active = _getFocusedElementPierceShadowDom();
    if (host.hasAttribute('popover') && !(active && host.contains(active))) {
      try {
        host.hidePopover();
        host.showPopover();
      } catch {
        // Not shown as a popover (unsupported browser): nothing to raise.
      }
    }
  }
}
