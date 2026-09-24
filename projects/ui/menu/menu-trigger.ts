import { CdkMenuTrigger } from '@angular/cdk/menu';
import { Directive, inject } from '@angular/core';

/**
 * Opens a `ui-menu` (declared in an `<ng-template>`) from a button, or a submenu from a
 * `uiMenuItem`. Composes CDK `CdkMenuTrigger` as a host directive, so the WAI-ARIA wiring
 * (`aria-haspopup`, `aria-expanded`, `aria-controls`), overlay positioning, the menu stack
 * (nested menus, outside click, Escape) and focus return all come from the CDK.
 *
 * Inputs forwarded to the CDK trigger: `uiMenuTriggerFor` (the `<ng-template>` that contains the
 * `ui-menu`), `uiMenuPosition` (preferred `ConnectedPosition[]`; by default below a button and
 * beside a parent item) and `uiMenuTriggerData` (context for the menu template). Outputs:
 * `uiMenuOpened`, `uiMenuClosed`.
 */
@Directive({
  selector: '[uiMenuTriggerFor]',
  exportAs: 'uiMenuTrigger',
  hostDirectives: [
    {
      directive: CdkMenuTrigger,
      inputs: [
        'cdkMenuTriggerFor: uiMenuTriggerFor',
        'cdkMenuPosition: uiMenuPosition',
        'cdkMenuTriggerData: uiMenuTriggerData',
      ],
      outputs: ['cdkMenuOpened: uiMenuOpened', 'cdkMenuClosed: uiMenuClosed'],
    },
  ],
  host: { class: 'ui-menu-trigger' },
})
export class UiMenuTrigger {
  private readonly cdkTrigger = inject(CdkMenuTrigger, { self: true });

  constructor() {
    // Lets the panel's enter animation grow from the side that touches the trigger.
    this.cdkTrigger.transformOriginSelector = '.ui-menu';
  }

  /** Whether the menu opened by this trigger is currently open. */
  isOpen(): boolean {
    return this.cdkTrigger.isOpen();
  }

  /** Opens the menu (focus stays where it is; use the keyboard or `focusFirstItem` flows for that). */
  open(): void {
    this.cdkTrigger.open();
  }

  /** Closes the menu and any submenus it opened. */
  close(): void {
    this.cdkTrigger.close();
  }

  /** Opens the menu when closed, closes it when open. */
  toggle(): void {
    this.cdkTrigger.toggle();
  }
}
