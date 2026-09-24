import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  ViewEncapsulation,
  inject,
  input,
  output,
} from '@angular/core';
import { UiPopover } from './popover';
import { tabbableElements } from './tabbable';

/**
 * Non-modal dialog surface rendered by `uiPopoverTrigger` inside an overlay.
 * @internal
 */
@Component({
  selector: 'ui-popover-panel',
  imports: [NgTemplateOutlet],
  template: `<ng-container [ngTemplateOutlet]="popover().templateRef" [ngTemplateOutletInjector]="contentInjector()" />`,
  styleUrl: './popover.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-popover',
    role: 'dialog',
    tabindex: '-1',
    '[id]': 'popover().panelId',
    '[attr.aria-label]': 'popover().labelledBy() ? null : popover().label()',
    '[attr.aria-labelledby]': 'popover().labelledBy()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class UiPopoverPanel {
  /** @internal */
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** Content definition. */
  readonly popover = input.required<UiPopover>();
  /** Injector for the content (provides the close control). */
  readonly contentInjector = input.required<Injector>();
  /** Tab or Shift+Tab would move focus out of the panel. */
  readonly tabOut = output<void>();

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
    const tabbables = tabbableElements(this.element);
    const active = this.element.ownerDocument.activeElement;
    const leaving =
      tabbables.length === 0 ||
      (!event.shiftKey && active === tabbables[tabbables.length - 1]) ||
      (event.shiftKey && (active === tabbables[0] || active === this.element));
    if (leaving) {
      event.preventDefault();
      this.tabOut.emit();
    }
  }
}
