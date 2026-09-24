import { CdkDialogContainer, DialogRef } from '@angular/cdk/dialog';
import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  inject,
  input,
  isDevMode,
  signal,
} from '@angular/core';
import { injectId } from '@usertrv/ui/a11y';
import { UiDialogRef } from './dialog-ref';

/**
 * Dialog heading. Put it on a heading element (`<h2 uiDialogTitle>`): its id becomes the
 * dialog's `aria-labelledby`, so screen readers announce the title when the dialog opens.
 */
@Directive({
  selector: '[uiDialogTitle]',
  exportAs: 'uiDialogTitle',
  host: { class: 'ui-dialog__title', '[id]': 'id' },
})
export class UiDialogTitle {
  /** Id of the title element (generated). */
  readonly id = injectId('ui-dialog-title');

  constructor() {
    const container = inject(DialogRef, { optional: true })?.containerInstance;
    if (!(container instanceof CdkDialogContainer)) {
      if (isDevMode()) console.warn('[uiDialogTitle] must be used inside a dialog opened with UiDialog or UiDrawer.');
      return;
    }
    // Deferred like Material's title: the container has usually been checked already in this pass.
    void Promise.resolve().then(() => container._addAriaLabelledBy(this.id));
    inject(DestroyRef).onDestroy(() => container._removeAriaLabelledBy(this.id));
  }
}

/**
 * Scrollable body of a dialog. Title and actions stay visible while it scrolls; when its content
 * overflows it becomes keyboard focusable so it can be scrolled without a pointer.
 */
@Directive({
  selector: '[uiDialogContent]',
  host: { class: 'ui-dialog__content', '[attr.tabindex]': 'scrollable() ? 0 : null' },
})
export class UiDialogContent {
  protected readonly scrollable = signal(false);

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() => this.scrollable.set(el.scrollHeight > el.clientHeight + 1));
      observer.observe(el);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}

/** Button row at the bottom of a dialog. */
@Directive({
  selector: '[uiDialogActions]',
  host: { class: 'ui-dialog__actions', '[class]': '"ui-dialog__actions--" + align()' },
})
export class UiDialogActions {
  /** Horizontal alignment of the buttons. */
  readonly align = input<'start' | 'end' | 'between'>('end');
}

/**
 * Closes the enclosing dialog on click, with the bound value as the result
 * (`<button uiButton [uiDialogClose]="true">Delete</button>`). Defaults the button `type` to `button`,
 * so it never submits a surrounding form by accident.
 */
@Directive({
  selector: 'button[uiDialogClose]',
  exportAs: 'uiDialogClose',
  host: { '[attr.type]': 'type()', '(click)': 'close()' },
})
export class UiDialogClose {
  private readonly ref = inject(UiDialogRef, { optional: true });

  /** Result passed to `UiDialogRef.close()`. */
  readonly result = input<unknown>(undefined, { alias: 'uiDialogClose' });
  /** Button type. */
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  constructor() {
    if (!this.ref && isDevMode()) console.warn('[uiDialogClose] must be used inside a dialog opened with UiDialog or UiDrawer.');
  }

  protected close(): void {
    this.ref?.close(this.result());
  }
}
