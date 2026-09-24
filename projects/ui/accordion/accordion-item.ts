import { CdkAccordionItem } from '@angular/cdk/accordion';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { injectId } from '@usertrv/ui/a11y';

/**
 * One section of a `ui-accordion`: a heading with a disclosure button (`aria-expanded`,
 * `aria-controls`) and a `role="region"` panel labelled by that button (WAI-ARIA APG Accordion).
 * Composes CDK `CdkAccordionItem` as a host directive, which coordinates single/multi expansion
 * with the parent accordion.
 *
 * The header text comes from `label`, or from projected content marked `uiAccordionTitle`
 * (e.g. `<span uiAccordionTitle>Billing <ui-badge>New</ui-badge></span>`).
 */
@Component({
  selector: 'ui-accordion-item',
  exportAs: 'uiAccordionItem',
  hostDirectives: [CdkAccordionItem],
  template: `
    <div class="ui-accordion-item__heading" role="heading" [attr.aria-level]="headingLevel()">
      <button
        #header
        type="button"
        class="ui-accordion-item__header"
        [id]="headerId"
        [attr.aria-expanded]="expanded()"
        [attr.aria-controls]="panelId"
        [attr.aria-disabled]="disabled() || null"
        (click)="toggle()"
      >
        <span class="ui-accordion-item__title">
          <ng-content select="[uiAccordionTitle]">{{ label() }}</ng-content>
        </span>
        <svg class="ui-accordion-item__chevron" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M3.7 6.2a.75.75 0 0 1 1.06 0L8 9.44l3.24-3.24a.75.75 0 1 1 1.06 1.06l-3.77 3.77a.75.75 0 0 1-1.06 0L3.7 7.26a.75.75 0 0 1 0-1.06Z" />
        </svg>
      </button>
    </div>
    <div
      class="ui-accordion-item__panel"
      role="region"
      [id]="panelId"
      [attr.aria-labelledby]="headerId"
      [attr.inert]="expanded() ? null : ''"
    >
      <div class="ui-accordion-item__clip">
        <div class="ui-accordion-item__content"><ng-content /></div>
      </div>
    </div>
  `,
  styleUrl: './accordion.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-accordion-item',
    '[class.ui-accordion-item--expanded]': 'expanded()',
    '[class.ui-accordion-item--disabled]': 'disabled()',
  },
})
export class UiAccordionItem {
  private readonly cdkItem = inject(CdkAccordionItem, { self: true });
  private readonly header = viewChild.required<ElementRef<HTMLButtonElement>>('header');

  /** Header text. Ignored when an element marked `uiAccordionTitle` is projected. */
  readonly label = input('');
  /** Whether the panel is open. Two-way bindable: `[(expanded)]`. */
  readonly expanded = model(false);
  /** Disabled items keep their current state; the header stays focusable with `aria-disabled`. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** `aria-level` of the heading that wraps the header button; match your page outline (1–6). */
  readonly headingLevel = input(3, { transform: numberAttribute });

  /** @internal */
  readonly headerId = injectId('ui-accordion-header');
  /** @internal */
  readonly panelId = injectId('ui-accordion-panel');

  constructor() {
    // The signal inputs are the public API; CDK keeps the single/multi coordination.
    effect(() => (this.cdkItem.disabled = this.disabled()));
    effect(() => (this.cdkItem.expanded = this.expanded()));
    this.cdkItem.expandedChange.pipe(takeUntilDestroyed()).subscribe((value) => this.expanded.set(value));
  }

  /** Opens the panel when closed and closes it when open (no-op while disabled). */
  toggle(): void {
    if (!this.disabled()) this.cdkItem.expanded = !this.expanded();
  }

  /** Opens the panel (no-op while disabled). */
  open(): void {
    if (!this.disabled()) this.cdkItem.expanded = true;
  }

  /** Closes the panel (no-op while disabled). */
  close(): void {
    if (!this.disabled()) this.cdkItem.expanded = false;
  }

  /** @internal */
  get headerElement(): HTMLButtonElement {
    return this.header().nativeElement;
  }
}
