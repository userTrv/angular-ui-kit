import { OverlayContainer } from '@angular/cdk/overlay';
import { Injectable, inject } from '@angular/core';

const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'LINK', 'TEMPLATE', 'NOSCRIPT']);

/**
 * Makes everything behind the topmost modal `inert`.
 *
 * CDK Dialog already sets `aria-hidden="true"` on the siblings of the overlay container, which hides
 * the page from screen readers but leaves it clickable and focusable (for example with a mouse,
 * with find-in-page or with a screen reader's virtual cursor). `inert` removes both, and is also
 * applied to lower dialogs in a stack so only the top one is interactive.
 *
 * Only attributes this service added are removed again; elements the app made inert itself, live
 * regions (announcements must keep working) and native popovers are left alone, mirroring CDK.
 *
 * @internal
 */
@Injectable({ providedIn: 'root' })
export class UiModalStack {
  private readonly overlayContainer = inject(OverlayContainer);
  private readonly stack: HTMLElement[] = [];
  private readonly inertBackground = new Set<Element>();
  private readonly inertModals = new Set<HTMLElement>();

  /** Registers the overlay host of a modal that just opened (it becomes the top one). */
  push(host: HTMLElement): void {
    this.stack.push(host);
    this.sync();
  }

  /** Unregisters a modal. Must run before focus is restored, since inert elements can't take focus. */
  remove(host: HTMLElement): void {
    const index = this.stack.indexOf(host);
    if (index > -1) this.stack.splice(index, 1);
    this.inertModals.delete(host);
    this.sync();
  }

  /** Number of open modals. */
  get size(): number {
    return this.stack.length;
  }

  private sync(): void {
    if (this.stack.length === 0) {
      for (const el of this.inertBackground) el.removeAttribute('inert');
      this.inertBackground.clear();
      return;
    }
    this.inertSiblingsOfOverlayContainer();

    const top = this.stack[this.stack.length - 1];
    for (const host of this.stack) {
      if (host === top) {
        if (this.inertModals.delete(host)) host.removeAttribute('inert');
      } else if (!host.hasAttribute('inert')) {
        host.setAttribute('inert', '');
        this.inertModals.add(host);
      }
    }
  }

  private inertSiblingsOfOverlayContainer(): void {
    const container = this.overlayContainer.getContainerElement();
    const parent = container.parentElement;
    if (!parent) return;
    for (const sibling of Array.from(parent.children)) {
      if (
        sibling === container ||
        SKIPPED_TAGS.has(sibling.nodeName) ||
        sibling.hasAttribute('aria-live') ||
        sibling.hasAttribute('popover') ||
        (sibling.hasAttribute('inert') && !this.inertBackground.has(sibling))
      ) {
        continue;
      }
      sibling.setAttribute('inert', '');
      this.inertBackground.add(sibling);
    }
  }
}
