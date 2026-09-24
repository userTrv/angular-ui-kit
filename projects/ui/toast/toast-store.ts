import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Injectable, computed, inject, signal } from '@angular/core';
import { UI_TOAST_CONFIG, UiToastAction, UiToastDismissReason, UiToastVariant } from './toast-config';

/** A toast as rendered by `ui-toaster`. */
export interface UiToastItem {
  /** Unique id. */
  readonly id: string;
  /** Heading. */
  readonly title?: string;
  /** Body text. */
  readonly message: string;
  /** Severity. */
  readonly variant: UiToastVariant;
  /** Action button. */
  readonly action?: UiToastAction;
}

interface Countdown {
  /** `duration: 0`: stays until closed. */
  persistent: boolean;
  remaining: number;
  startedAt: number;
  handle: ReturnType<typeof setTimeout> | null;
  shown: boolean;
  resolve: (reason: UiToastDismissReason) => void;
}

/**
 * Toast state shared by the `UiToast` service and the `ui-toaster` region: the queue, the
 * visible slice, pausable countdowns and screen reader announcements. Rendering is driven by
 * signals only, so it works zoneless; timers are plain `setTimeout` + `Date.now()` (fake-timer friendly).
 * @internal
 */
@Injectable({ providedIn: 'root' })
export class UiToastStore {
  private readonly config = inject(UI_TOAST_CONFIG);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly items = signal<readonly UiToastItem[]>([]);
  private readonly countdowns = new Map<string, Countdown>();
  private readonly pauses = new Set<string>();
  private announcements: Promise<unknown> = Promise.resolve();

  /** Number of mounted `ui-toaster` elements; `UiToast` creates one when there is none. */
  toasters = 0;

  /** Toasts on screen, oldest first. */
  readonly visible = computed(() => this.items().slice(0, this.config.maxVisible));
  /** Number of toasts waiting for a free slot. */
  readonly queued = computed(() => Math.max(0, this.items().length - this.config.maxVisible));

  add(item: UiToastItem, duration: number): Promise<UiToastDismissReason> {
    const dismissed = new Promise<UiToastDismissReason>((resolve) => {
      const countdown: Countdown = { persistent: duration <= 0, remaining: duration, startedAt: 0, handle: null, shown: false, resolve };
      this.countdowns.set(item.id, countdown);
    });
    this.items.update((list) => [...list, item]);
    this.sync();
    return dismissed;
  }

  dismiss(id: string, reason: UiToastDismissReason): void {
    const countdown = this.countdowns.get(id);
    if (!countdown) return;
    if (countdown.handle) clearTimeout(countdown.handle);
    this.countdowns.delete(id);
    this.items.update((list) => list.filter((t) => t.id !== id));
    countdown.resolve(reason);
    this.sync();
  }

  dismissAll(): void {
    for (const { id } of this.items()) this.dismiss(id, 'program');
  }

  runAction(id: string): void {
    this.items().find((t) => t.id === id)?.action?.handler();
    this.dismiss(id, 'action');
  }

  /** Stops every countdown (hover, focus-within...). Countdowns resume with their remaining time. */
  pause(source: string): void {
    this.pauses.add(source);
    const now = Date.now();
    for (const countdown of this.countdowns.values()) {
      if (!countdown.handle) continue;
      clearTimeout(countdown.handle);
      countdown.handle = null;
      countdown.remaining -= now - countdown.startedAt;
    }
  }

  resume(source: string): void {
    if (this.pauses.delete(source)) this.sync();
  }

  /** Announces newly visible toasts and starts their countdowns unless paused. */
  private sync(): void {
    for (const item of this.visible()) {
      const countdown = this.countdowns.get(item.id);
      if (!countdown) continue;
      if (!countdown.shown) {
        countdown.shown = true;
        this.announce(item);
      }
      if (this.pauses.size === 0 && !countdown.handle && !countdown.persistent) {
        countdown.startedAt = Date.now();
        countdown.handle = setTimeout(() => this.dismiss(item.id, 'timeout'), Math.max(0, countdown.remaining));
      }
    }
  }

  private announce(item: UiToastItem): void {
    const hotkey = item.action && this.config.focusHotkey ? ` Press ${this.config.focusHotkey} to reach notifications.` : '';
    const text = `${[item.title, item.message].filter(Boolean).join('. ')}${hotkey}`;
    const politeness = item.variant === 'danger' ? 'assertive' : 'polite';
    // Sequential: LiveAnnouncer replaces its message, so a burst would otherwise only read the last toast.
    this.announcements = this.announcements.then(() => this.announcer.announce(text, politeness));
  }
}
