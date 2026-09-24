import type { AutoFocusTarget } from '@angular/cdk/dialog';
import { InjectionToken, Injector, ViewContainerRef } from '@angular/core';

/**
 * Width preset of a dialog. `lg` switches to full screen below 40rem viewport width;
 * `fullscreen` is always full screen.
 */
export type UiDialogSize = 'sm' | 'md' | 'lg' | 'fullscreen';

/** ARIA role of the dialog surface. Use `alertdialog` for confirmations that interrupt the user. */
export type UiDialogRole = 'dialog' | 'alertdialog';

/** Options for `UiDialog.open()`. */
export interface UiDialogConfig<D = unknown> {
  /** Data injected into the dialog content with `inject(UI_DIALOG_DATA)`. */
  data?: D;
  /** Width preset. Default `md`. */
  size?: UiDialogSize;
  /** ARIA role. Default `dialog`. */
  role?: UiDialogRole;
  /** When true, Escape and backdrop clicks do not close the dialog (focus is kept inside instead). */
  disableClose?: boolean;
  /** Whether a dimmed backdrop is rendered behind the dialog. Default true. */
  hasBackdrop?: boolean;
  /**
   * Where focus goes on open: `first-tabbable` (default), `dialog` (the surface), `first-heading`,
   * or a CSS selector inside the dialog.
   */
  autoFocus?: AutoFocusTarget | string;
  /**
   * Where focus goes after close: `true` (default) returns it to the element that opened the dialog,
   * a CSS selector or an element picks another target, `false` leaves focus alone.
   */
  restoreFocus?: boolean | string | HTMLElement;
  /** Accessible name when the dialog has no `uiDialogTitle`. */
  ariaLabel?: string;
  /** Id of an element that labels the dialog; `uiDialogTitle` sets this automatically. */
  ariaLabelledBy?: string;
  /** Id of an element that describes the dialog (for example the message of a confirmation). */
  ariaDescribedBy?: string;
  /** Extra CSS classes for the overlay pane. */
  panelClass?: string | string[];
  /** Explicit dialog id; generated when omitted. */
  id?: string;
  /** Closes the dialog on browser history navigation. Default true. */
  closeOnNavigation?: boolean;
  /** Parent in the logical component tree: affects dependency injection, not DOM placement. */
  viewContainerRef?: ViewContainerRef;
  /** Injector for the dialog content; takes precedence over `viewContainerRef`. */
  injector?: Injector;
}

/** Injection token carrying `UiDialogConfig.data` into the dialog content. */
export const UI_DIALOG_DATA = new InjectionToken<unknown>('UI_DIALOG_DATA');
