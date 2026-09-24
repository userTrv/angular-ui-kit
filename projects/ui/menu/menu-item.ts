import { CdkMenuItem, CdkMenuItemCheckbox, CdkMenuItemRadio, CdkMenuTrigger } from '@angular/cdk/menu';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  effect,
  inject,
  input,
  model,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * A menu action (`role="menuitem"`) on a native `<button>` or `<a>`. Composes CDK `CdkMenuItem`.
 * Add `[uiMenuTriggerFor]` to the same element to make it open a submenu (Right arrow / Enter /
 * hover); a chevron is rendered automatically.
 *
 * Inputs forwarded to the CDK item: `disabled: boolean` (the item stays focusable and is exposed
 * with `aria-disabled`, as the APG recommends for menus),
 * `typeaheadLabel: string` (text matched by typeahead instead of the item text).
 * Output forwarded from the CDK: `triggered` — the item was activated (click, Enter, Space).
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute component keeps native <button>/<a> semantics
  selector: 'button[uiMenuItem], a[uiMenuItem]',
  exportAs: 'uiMenuItem',
  hostDirectives: [
    {
      directive: CdkMenuItem,
      inputs: ['cdkMenuItemDisabled: disabled', 'cdkMenuitemTypeaheadLabel: typeaheadLabel'],
      outputs: ['cdkMenuItemTriggered: triggered'],
    },
  ],
  template: `
    <ng-content select="[uiMenuItemIcon]" />
    <span class="ui-menu-item__label"><ng-content /></span>
    <ng-content select="[uiMenuItemShortcut]" />
    @if (hasSubmenu) {
      <svg class="ui-menu-item__submenu-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M6.2 3.7a.75.75 0 0 1 1.06 0l3.77 3.77a.75.75 0 0 1 0 1.06l-3.77 3.77a.75.75 0 1 1-1.06-1.06L9.44 8 6.2 4.76a.75.75 0 0 1 0-1.06Z" />
      </svg>
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-menu-item',
    '[class.ui-menu-item--destructive]': 'destructive()',
    // A static `disabled` attribute must not disable the native button: disabled menu items stay
    // focusable (APG), the CDK exposes them with aria-disabled instead.
    '[attr.disabled]': 'null',
  },
})
export class UiMenuItem {
  /** Styles the item as a destructive action (delete, revoke). Keep a clear text label too. */
  readonly destructive = input(false, { transform: booleanAttribute });

  protected readonly hasSubmenu = inject(CdkMenuTrigger, { self: true, optional: true }) !== null;
}

/**
 * A toggleable menu item (`role="menuitemcheckbox"`, `aria-checked`). Composes CDK
 * `CdkMenuItemCheckbox`. Supports `[(checked)]`. Space toggles without closing the menu;
 * click and Enter toggle and close it.
 *
 * Inputs forwarded to the CDK: `disabled: boolean`, `typeaheadLabel: string`.
 * Output forwarded from the CDK: `triggered`.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute component keeps native <button> semantics
  selector: 'button[uiMenuItemCheckbox]',
  exportAs: 'uiMenuItemCheckbox',
  hostDirectives: [
    {
      directive: CdkMenuItemCheckbox,
      inputs: ['cdkMenuItemDisabled: disabled', 'cdkMenuitemTypeaheadLabel: typeaheadLabel'],
      outputs: ['cdkMenuItemTriggered: triggered'],
    },
  ],
  template: `
    <svg class="ui-menu-item__check" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M13.3 4.3a.75.75 0 0 1 0 1.06l-6 6a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 1 1 1.06-1.06L6.77 9.77l5.47-5.47a.75.75 0 0 1 1.06 0Z" />
    </svg>
    <span class="ui-menu-item__label"><ng-content /></span>
    <ng-content select="[uiMenuItemShortcut]" />
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-menu-item ui-menu-item--selectable',
    '[attr.aria-checked]': 'checked()',
    '[attr.disabled]': 'null',
  },
})
export class UiMenuItemCheckbox {
  private readonly cdkItem = inject(CdkMenuItemCheckbox, { self: true });

  /** Whether the item is checked. Two-way bindable: `[(checked)]`. */
  readonly checked = model(false);

  constructor() {
    effect(() => (this.cdkItem.checked = this.checked()));
    this.cdkItem.triggered.pipe(takeUntilDestroyed()).subscribe(() => this.checked.update((v) => !v));
  }
}

/**
 * One option of a single-choice set (`role="menuitemradio"`, `aria-checked`). Radio items in the
 * same `ui-menu` or `[uiMenuGroup]` are mutually exclusive. Composes CDK `CdkMenuItemRadio`.
 * Controlled: bind `[checked]` from your state and update it on `(triggered)`.
 *
 * Inputs forwarded to the CDK: `disabled: boolean`, `typeaheadLabel: string`.
 * Output forwarded from the CDK: `triggered`.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute component keeps native <button> semantics
  selector: 'button[uiMenuItemRadio]',
  exportAs: 'uiMenuItemRadio',
  hostDirectives: [
    {
      directive: CdkMenuItemRadio,
      inputs: ['cdkMenuItemDisabled: disabled', 'cdkMenuitemTypeaheadLabel: typeaheadLabel'],
      outputs: ['cdkMenuItemTriggered: triggered'],
    },
  ],
  template: `
    <span class="ui-menu-item__radio" aria-hidden="true"></span>
    <span class="ui-menu-item__label"><ng-content /></span>
    <ng-content select="[uiMenuItemShortcut]" />
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-menu-item ui-menu-item--selectable',
    '[attr.aria-checked]': 'checked()',
    '[attr.disabled]': 'null',
  },
})
export class UiMenuItemRadio {
  private readonly cdkItem = inject(CdkMenuItemRadio, { self: true });

  /** Whether this option is the selected one. Bind it from your state (controlled). */
  readonly checked = input(false, { transform: booleanAttribute });

  constructor() {
    // Our `aria-checked` binding follows the input, so the DOM always reflects the consumer's state
    // even though the CDK's selection dispatcher also flips sibling radios internally.
    effect(() => (this.cdkItem.checked = this.checked()));
  }
}
