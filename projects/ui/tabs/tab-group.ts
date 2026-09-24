import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  afterRenderEffect,
  computed,
  contentChildren,
  input,
  model,
  viewChild,
  viewChildren,
} from '@angular/core';
import { UiOrientation, UiRovingFocusGroup, UiRovingFocusItem } from '@usertrv/ui/a11y';
import { UiTab } from './tab';

/**
 * How a tab gets selected from the keyboard (WAI-ARIA APG Tabs):
 * `automatic` — arrow keys move focus and select; `manual` — arrows only move focus, Enter/Space select.
 */
export type UiTabActivation = 'automatic' | 'manual';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

/**
 * Tabs following the WAI-ARIA APG Tabs pattern: `role="tablist"` with roving focus (from
 * `UiRovingFocusGroup`), `role="tab"` buttons with `aria-selected` / `aria-controls`, and
 * `role="tabpanel"` regions labelled by their tab.
 */
@Component({
  selector: 'ui-tab-group',
  exportAs: 'uiTabGroup',
  imports: [NgTemplateOutlet, UiRovingFocusGroup, UiRovingFocusItem],
  template: `
    <div
      #list
      class="ui-tab-group__list"
      role="tablist"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-labelledby]="ariaLabelledby() || null"
      [attr.aria-orientation]="orientation()"
      [uiRovingFocusGroup]="orientation()"
    >
      @for (tab of tabs(); track tab; let i = $index) {
        <button
          type="button"
          role="tab"
          class="ui-tab-group__tab"
          uiRovingFocusItem
          [uiRovingFocusItemDisabled]="tab.disabled()"
          [id]="tab.tabId"
          [attr.aria-selected]="i === selected()"
          [attr.aria-controls]="tab.panelId"
          [attr.aria-disabled]="tab.disabled() || null"
          (click)="select(i)"
          (focus)="onTabFocus(i)"
        >
          @if (tab.labelTemplate(); as label) {
            <ng-container [ngTemplateOutlet]="label.template" />
          } @else {
            {{ tab.label() }}
          }
        </button>
      }
      <span #indicator class="ui-tab-group__indicator" aria-hidden="true"></span>
    </div>
    @for (tab of tabs(); track tab; let i = $index) {
      <div
        #panel
        role="tabpanel"
        class="ui-tab-group__panel"
        [id]="tab.panelId"
        [attr.aria-labelledby]="tab.tabId"
        [hidden]="i !== selected()"
      >
        @if (tab.lazyContent(); as lazy) {
          @if (i === selected()) {
            <ng-container [ngTemplateOutlet]="lazy.template" />
          }
        } @else {
          <ng-container [ngTemplateOutlet]="tab.eagerContent()" />
        }
      </div>
    }
  `,
  styleUrl: './tabs.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-tab-group',
    '[class.ui-tab-group--vertical]': 'orientation() === "vertical"',
    // The accessible name belongs to the tablist, not to this generic host element.
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
  },
})
export class UiTabGroup {
  /** Index of the selected tab. Two-way bindable: `[(selectedIndex)]`. */
  readonly selectedIndex = model(0);
  /** `automatic`: arrows select as they move focus. `manual`: arrows move focus, Enter/Space select. */
  readonly activation = input<UiTabActivation>('automatic');
  /** Layout and arrow keys: Left/Right for `horizontal`, Up/Down for `vertical` (`aria-orientation`). */
  readonly orientation = input<UiOrientation>('horizontal');
  /** Accessible name of the tablist (forwarded from the host to `role="tablist"`). */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  /** Id of the element that labels the tablist (forwarded to `role="tablist"`). */
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  protected readonly tabs = contentChildren(UiTab);

  /** The effective selection: clamped to the existing tabs. */
  protected readonly selected = computed(() => {
    const count = this.tabs().length;
    return count === 0 ? -1 : Math.min(Math.max(this.selectedIndex(), 0), count - 1);
  });

  private readonly rovingGroup = viewChild.required(UiRovingFocusGroup);
  private readonly tabButtons = viewChildren(UiRovingFocusItem);
  private readonly panels = viewChildren<ElementRef<HTMLElement>>('panel');
  private readonly list = viewChild.required<ElementRef<HTMLElement>>('list');
  private readonly indicator = viewChild.required<ElementRef<HTMLElement>>('indicator');

  constructor() {
    afterRenderEffect(() => {
      const index = this.selected();
      const button = this.tabButtons()[index];
      // Keep the roving tab stop on the selected tab, so Tab into the tablist lands on it (APG).
      if (button) this.rovingGroup().setActiveItem(button);
      this.positionIndicator(button?.element);
      this.updatePanelTabStops(index);
    });
  }

  /** Selects the tab at `index` unless it is disabled or out of range. */
  select(index: number): void {
    const tab = this.tabs()[index];
    if (tab && !tab.disabled()) this.selectedIndex.set(index);
  }

  protected onTabFocus(index: number): void {
    if (this.activation() === 'automatic') this.select(index);
  }

  private positionIndicator(button: HTMLElement | undefined): void {
    const indicator = this.indicator().nativeElement;
    const vertical = this.orientation() === 'vertical';
    indicator.style.setProperty('--_indicator-offset', `${button ? (vertical ? button.offsetTop : button.offsetLeft) : 0}px`);
    indicator.style.setProperty('--_indicator-size', `${button ? (vertical ? button.offsetHeight : button.offsetWidth) : 0}px`);
    // Enable the slide transition only after the first placement, so it does not animate in from 0.
    queueMicrotask(() => this.list().nativeElement.classList.add('ui-tab-group__list--ready'));
  }

  /** APG: a panel without focusable content is itself a tab stop, so keyboard users can reach it. */
  private updatePanelTabStops(selected: number): void {
    this.panels().forEach((panel, i) => {
      const el = panel.nativeElement;
      if (i === selected && !el.querySelector(FOCUSABLE)) el.setAttribute('tabindex', '0');
      else el.removeAttribute('tabindex');
    });
  }
}
