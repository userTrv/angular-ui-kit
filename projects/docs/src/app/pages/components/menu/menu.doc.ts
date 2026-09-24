import { defineDoc } from '../../../core/doc-model';
import { MenuBasicExample } from './examples/menu-basic.example';
import { MenuNestedExample } from './examples/menu-nested.example';
import { MenuSelectableExample } from './examples/menu-selectable.example';

export const doc = defineDoc({
  slug: 'menu',
  name: 'Menu',
  category: 'Actions',
  summary: 'Action menus with nested submenus, checkbox and radio items, icons and shortcut hints — built on CDK Menu.',
  entryPoint: '@usertrv/ui/menu',
  api: [
    'UiMenuTrigger',
    'UiMenu',
    'UiMenuItem',
    'UiMenuItemCheckbox',
    'UiMenuItemRadio',
    'UiMenuGroup',
    'UiMenuSeparator',
    'UiMenuItemIcon',
    'UiMenuItemShortcut',
  ],
  layering:
    'A thin styled layer over `@angular/cdk/menu`, composed with **host directives**: `UiMenuTrigger` wraps `CdkMenuTrigger` (inputs re-exposed as `uiMenuTriggerFor`, `uiMenuPosition`, `uiMenuTriggerData`), `UiMenu` wraps `CdkMenu`, items wrap `CdkMenuItem` / `CdkMenuItemCheckbox` / `CdkMenuItemRadio` (`disabled`, `typeaheadLabel`, `triggered`). Keyboard handling, the menu stack, overlay positioning and focus return are the CDK’s; the kit adds the panel and item styles, the icon/shortcut slots, a submenu chevron and signal-based `checked` state.',
  examples: [
    {
      title: 'Actions menu',
      component: MenuBasicExample,
      file: 'menu-basic.example.ts',
      description: 'Icons and shortcut hints are visual only; the shortcut is exposed with `aria-keyshortcuts`. Disabled items stay focusable (`aria-disabled`).',
    },
    {
      title: 'Nested submenus',
      component: MenuNestedExample,
      file: 'menu-nested.example.ts',
      description: 'Put `[uiMenuTriggerFor]` on a `uiMenuItem` to open a submenu. Right arrow opens it, Left arrow or Escape closes it and returns focus to the parent item.',
    },
    {
      title: 'Checkbox and radio items',
      component: MenuSelectableExample,
      file: 'menu-selectable.example.ts',
      description: 'Checkbox items support `[(checked)]` and toggle with Space without closing the menu. Radio items in one `uiMenuGroup` are exclusive and controlled through `[checked]` + `(triggered)`.',
    },
  ],
  keyboard: [
    { keys: 'Enter / Space / ArrowDown', action: 'On the trigger: opens the menu and focuses the first item.' },
    { keys: 'ArrowUp', action: 'On the trigger: opens the menu and focuses the last item.' },
    { keys: 'ArrowDown / ArrowUp', action: 'Moves focus to the next / previous item (wraps).' },
    { keys: 'Home / End', action: 'Moves focus to the first / last item.' },
    { keys: 'A–Z', action: 'Typeahead: focuses the next item whose label starts with the typed characters.' },
    { keys: 'Enter', action: 'Activates the item and closes the menu; on a submenu item opens the submenu.' },
    { keys: 'Space', action: 'Activates the item; checkbox and radio items stay open.' },
    { keys: 'ArrowRight', action: 'Opens the submenu of the focused item and focuses its first item (ArrowLeft in RTL).' },
    { keys: 'ArrowLeft', action: 'Closes the current submenu and returns focus to its parent item.' },
    { keys: 'Escape', action: 'Closes the current menu level and returns focus to its trigger.' },
    { keys: 'Tab', action: 'Closes all menus and moves focus onward.' },
  ],
  a11y: [
    'Follows the WAI-ARIA APG **Menu Button** and **Menu** patterns: the trigger gets `aria-haspopup="menu"`, `aria-expanded` and `aria-controls`; the panel is `role="menu"`; items are `menuitem`, `menuitemcheckbox` or `menuitemradio` with `aria-checked`.',
    'Behaviour comes from `@angular/cdk/menu`, which is verified here with tests for nesting, typeahead, arrow keys, Escape/Left closing submenus and focus return.',
    'Disabled items stay focusable and use `aria-disabled`, as the APG recommends for menus, so users can discover them. A static `disabled` attribute is stripped from the native button for that reason.',
    'Checked state is drawn from `aria-checked` in CSS, so the visual state can never drift from what assistive tech hears.',
    'Shortcut hints are `aria-hidden`: add `aria-keyshortcuts` to the item. The kit does not register the shortcut itself.',
    'Use a menu for **actions**. For choosing a value in a form, use a select or listbox; for site navigation, use links.',
    'Not included: a menubar wrapper (`CdkMenuBar`) and a context-menu wrapper (`CdkContextMenuTrigger`); both can be used directly with `ui-menu` panels.',
  ],
});
