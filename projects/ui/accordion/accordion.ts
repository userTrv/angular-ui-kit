import { CdkAccordion } from '@angular/cdk/accordion';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  contentChildren,
  effect,
  inject,
  input,
} from '@angular/core';
import { UiAccordionItem } from './accordion-item';

/**
 * A stack of `ui-accordion-item`s (WAI-ARIA APG Accordion). Composes CDK `CdkAccordion` as a host
 * directive: by default opening one item closes the others; set `multi` to allow several open.
 * Implements the optional APG keyboard support: Up/Down/Home/End move focus between headers.
 */
@Component({
  selector: 'ui-accordion',
  exportAs: 'uiAccordion',
  hostDirectives: [CdkAccordion],
  template: '<ng-content />',
  // Styles ship with UiAccordionItem (always present inside an accordion).
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-accordion', '(keydown)': 'onKeydown($event)' },
})
export class UiAccordion {
  private readonly cdkAccordion = inject(CdkAccordion, { self: true });
  private readonly items = contentChildren(UiAccordionItem);

  /** Allows more than one item to be expanded at the same time. */
  readonly multi = input(false, { transform: booleanAttribute });

  constructor() {
    effect(() => (this.cdkAccordion.multi = this.multi()));
  }

  /** Expands every enabled item. Only has an effect when `multi` is true. */
  openAll(): void {
    this.cdkAccordion.openAll();
  }

  /** Collapses every enabled item. */
  closeAll(): void {
    this.cdkAccordion.closeAll();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const headers = this.items().map((item) => item.headerElement);
    const index = headers.indexOf(event.target as HTMLButtonElement);
    if (index === -1) return;
    const last = headers.length - 1;
    let next: number;
    switch (event.key) {
      case 'ArrowDown':
        next = index === last ? 0 : index + 1;
        break;
      case 'ArrowUp':
        next = index === 0 ? last : index - 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    headers[next].focus();
  }
}
