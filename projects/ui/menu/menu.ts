import { CdkMenu, CdkMenuGroup } from '@angular/cdk/menu';
import { ChangeDetectionStrategy, Component, Directive, ViewEncapsulation } from '@angular/core';

/**
 * The menu panel (`role="menu"`). Put it inside the `<ng-template>` referenced by
 * `[uiMenuTriggerFor]`. Composes CDK `CdkMenu` as a host directive: roving focus between items,
 * Up/Down/Home/End, typeahead, Left/Escape to close a submenu and radio-group coordination.
 *
 * Output forwarded from the CDK: `closed` — emits when the menu closes.
 */
@Component({
  selector: 'ui-menu, [uiMenu]',
  exportAs: 'uiMenu',
  hostDirectives: [{ directive: CdkMenu, outputs: ['closed'] }],
  template: '<ng-content />',
  styleUrl: './menu.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-menu' },
})
export class UiMenu {}

/**
 * Groups related items (`role="group"`). Radio items inside one group are mutually exclusive.
 * Give the group an accessible name with `aria-label` when it holds radio items.
 */
@Directive({
  selector: '[uiMenuGroup]',
  exportAs: 'uiMenuGroup',
  hostDirectives: [CdkMenuGroup],
  host: { class: 'ui-menu-group' },
})
export class UiMenuGroup {}

/** A horizontal rule between groups of items (`role="separator"`, skipped by the keyboard). */
@Component({
  selector: 'ui-menu-separator',
  template: '',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-menu-separator', role: 'separator' },
})
export class UiMenuSeparator {}

/** Marks a leading icon inside a menu item: aligned in the icon column and hidden from assistive tech. */
@Directive({
  selector: '[uiMenuItemIcon]',
  host: { class: 'ui-menu-item__icon', 'aria-hidden': 'true' },
})
export class UiMenuItemIcon {}

/**
 * A keyboard shortcut hint at the end of a menu item. It is visual only (`aria-hidden`): expose the
 * shortcut to assistive tech with `aria-keyshortcuts` on the item, e.g. `aria-keyshortcuts="Control+D"`.
 */
@Directive({
  selector: '[uiMenuItemShortcut]',
  host: { class: 'ui-menu-item__shortcut', 'aria-hidden': 'true' },
})
export class UiMenuItemShortcut {}
