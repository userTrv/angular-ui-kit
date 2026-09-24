import { _getFocusedElementPierceShadowDom } from '@angular/cdk/platform';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  ViewEncapsulation,
  afterNextRender,
  computed,
  inject,
  input,
} from '@angular/core';
import { UI_TOAST_CONFIG, UiToastPosition } from './toast-config';
import { UiToastStore } from './toast-store';
import { UiToastIcon } from './toast-icon';

/**
 * Region that renders toasts. Created automatically on the first `UiToast.show()`; place
 * `<ui-toaster />` in the app shell instead to control its position or DOM location.
 *
 * It is a `region` landmark named "Notifications" (reachable from the screen reader landmark list)
 * and `F8` moves focus into it, Escape back. Toasts never take focus on their own. Hovering or
 * focusing the region pauses every countdown.
 */
@Component({
  selector: 'ui-toaster',
  imports: [UiToastIcon],
  template: `
    <ol class="ui-toaster__list">
      @for (toast of store.visible(); track toast.id) {
        <li class="ui-toast" [class]="'ui-toast--' + toast.variant">
          <ui-toast-icon class="ui-toast__icon" [variant]="toast.variant" />
          <div class="ui-toast__body">
            @if (toast.title) {
              <p class="ui-toast__title">{{ toast.title }}</p>
            }
            <p class="ui-toast__message">{{ toast.message }}</p>
          </div>
          @if (toast.action; as action) {
            <button type="button" class="ui-toast__action" (click)="run(toast.id)">{{ action.label }}</button>
          }
          <button
            type="button"
            class="ui-toast__close"
            [attr.aria-label]="'Dismiss: ' + (toast.title || toast.message)"
            (click)="close(toast.id)"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M5.3 5.3a1 1 0 0 1 1.4 0L10 8.6l3.3-3.3a1 1 0 1 1 1.4 1.4L11.4 10l3.3 3.3a1 1 0 0 1-1.4 1.4L10 11.4l-3.3 3.3a1 1 0 0 1-1.4-1.4L8.6 10 5.3 6.7a1 1 0 0 1 0-1.4Z" />
            </svg>
          </button>
        </li>
      }
    </ol>
  `,
  styleUrl: './toast.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-toaster',
    tabindex: '-1',
    '[class]': '"ui-toaster--" + resolvedPosition()',
    '[attr.role]': 'hasToasts() ? "region" : null',
    '[attr.aria-label]': 'hasToasts() ? config.label : null',
    '(pointerenter)': 'store.pause("hover")',
    '(pointerleave)': 'store.resume("hover")',
    '(focusin)': 'store.pause("focus")',
    '(focusout)': 'onFocusOut($event)',
    '(keydown.escape)': 'returnFocus()',
    '(document:keydown)': 'onDocumentKeydown($event)',
  },
})
export class UiToaster {
  protected readonly store = inject(UiToastStore);
  protected readonly config = inject(UI_TOAST_CONFIG);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private returnFocusTo: HTMLElement | null = null;

  /** Stacking position; defaults to the configured one. */
  readonly position = input<UiToastPosition | null>(null);

  protected readonly resolvedPosition = computed(() => this.position() ?? this.config.position);
  protected readonly hasToasts = computed(() => this.store.visible().length > 0);

  constructor() {
    this.store.toasters++;
    inject(DestroyRef).onDestroy(() => {
      this.store.toasters--;
      this.store.resume('hover');
      this.store.resume('focus');
    });
  }

  protected run(id: string): void {
    this.store.runAction(id);
    this.keepFocusAfterRemoval();
  }

  protected close(id: string): void {
    this.store.dismiss(id, 'close');
    this.keepFocusAfterRemoval();
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !this.element.contains(next)) this.store.resume('focus');
  }

  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.config.focusHotkey || event.key !== this.config.focusHotkey || !this.hasToasts()) return;
    event.preventDefault();
    const active = _getFocusedElementPierceShadowDom();
    if (!active || !this.element.contains(active)) this.returnFocusTo = active;
    this.element.focus();
  }

  /** Escape inside the region: go back to where F8 was pressed. */
  protected returnFocus(): void {
    const target = this.returnFocusTo;
    this.returnFocusTo = null;
    if (target?.isConnected) target.focus();
  }

  /** The focused button was removed with its toast: keep focus in the region instead of dropping it to <body>. */
  private keepFocusAfterRemoval(): void {
    afterNextRender(
      () => {
        const active = _getFocusedElementPierceShadowDom();
        if (active && active !== this.element.ownerDocument.body) return;
        const nextClose = this.element.querySelector<HTMLElement>('.ui-toast__close');
        if (nextClose) nextClose.focus();
        else if (this.returnFocusTo?.isConnected) this.returnFocus();
        else this.store.resume('focus');
      },
      { injector: this.injector },
    );
  }
}
