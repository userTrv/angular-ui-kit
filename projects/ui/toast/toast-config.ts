import { InjectionToken, Provider } from '@angular/core';

/** Visual and announcement severity. `danger` is announced assertively, the others politely. */
export type UiToastVariant = 'info' | 'success' | 'warning' | 'danger';

/** Screen corner or edge the toasts stack in. `end` follows the text direction. */
export type UiToastPosition = 'top-end' | 'bottom-end' | 'bottom-center';

/** Why a toast went away. */
export type UiToastDismissReason = 'timeout' | 'action' | 'close' | 'program';

/** Single action button of a toast, e.g. "Undo". Running it also dismisses the toast. */
export interface UiToastAction {
  /** Button label. */
  label: string;
  /** Called on click. */
  handler: () => void;
}

/** Options for `UiToast.show()`. */
export interface UiToastOptions {
  /** Short heading, e.g. "File deleted". */
  title?: string;
  /** Body text. */
  message: string;
  /** Default `info`. */
  variant?: UiToastVariant;
  /**
   * Time on screen in ms before auto-dismiss, counted only while visible and not hovered or focused.
   * `0` keeps the toast until closed. Default: the configured duration, doubled for toasts with an action.
   */
  duration?: number;
  /** Optional action button. */
  action?: UiToastAction;
}

/** Global toast settings, see `provideUiToast()`. */
export interface UiToastConfig {
  /** Where the auto-created toaster stacks toasts. Default `bottom-end`. */
  position: UiToastPosition;
  /** Toasts shown at once; the rest wait in a queue. Default 3. */
  maxVisible: number;
  /** Default duration in ms. Default 5000. */
  duration: number;
  /** Accessible name of the notifications region. Default "Notifications". */
  label: string;
  /** Key that moves focus to the toasts (and Escape back). `null` disables it. Default `F8`. */
  focusHotkey: string | null;
}

/** @internal */
export const UI_TOAST_DEFAULTS: UiToastConfig = {
  position: 'bottom-end',
  maxVisible: 3,
  duration: 5000,
  label: 'Notifications',
  focusHotkey: 'F8',
};

/** Injection token with the resolved toast settings. */
export const UI_TOAST_CONFIG = new InjectionToken<UiToastConfig>('UI_TOAST_CONFIG', {
  providedIn: 'root',
  factory: () => UI_TOAST_DEFAULTS,
});

/** Overrides toast settings: `providers: [provideUiToast({ position: 'top-end' })]`. */
export function provideUiToast(config: Partial<UiToastConfig>): Provider {
  return { provide: UI_TOAST_CONFIG, useValue: { ...UI_TOAST_DEFAULTS, ...config } };
}
