import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations, press } from '../test-utils';
import {
  UiMenu,
  UiMenuGroup,
  UiMenuItem,
  UiMenuItemCheckbox,
  UiMenuItemIcon,
  UiMenuItemRadio,
  UiMenuItemShortcut,
  UiMenuSeparator,
  UiMenuTrigger,
} from './index';

@Component({
  imports: [
    UiMenu,
    UiMenuTrigger,
    UiMenuItem,
    UiMenuItemCheckbox,
    UiMenuItemRadio,
    UiMenuGroup,
    UiMenuSeparator,
    UiMenuItemIcon,
    UiMenuItemShortcut,
  ],
  template: `
    <button id="trigger" [uiMenuTriggerFor]="main">File</button>

    <ng-template #main>
      <ui-menu>
        <button uiMenuItem (triggered)="log.push('rename')">Rename</button>
        <button uiMenuItem aria-keyshortcuts="Control+D" (triggered)="log.push('duplicate')">
          <svg uiMenuItemIcon viewBox="0 0 16 16"></svg>
          Duplicate
          <kbd uiMenuItemShortcut>Ctrl D</kbd>
        </button>
        <button uiMenuItem disabled>Archive</button>
        <button uiMenuItem [uiMenuTriggerFor]="share">Share</button>
        <ui-menu-separator />
        <button uiMenuItemCheckbox [(checked)]="wrap">Word wrap</button>
        <div uiMenuGroup aria-label="Sort by">
          <button uiMenuItemRadio [checked]="sort() === 'name'" (triggered)="sort.set('name')">Name</button>
          <button uiMenuItemRadio [checked]="sort() === 'date'" (triggered)="sort.set('date')">Date</button>
        </div>
        <ui-menu-separator />
        <button uiMenuItem destructive (triggered)="log.push('delete')">Delete</button>
      </ui-menu>
    </ng-template>

    <ng-template #share>
      <ui-menu>
        <button uiMenuItem>Copy link</button>
        <button uiMenuItem>Email</button>
      </ui-menu>
    </ng-template>
  `,
})
class Host {
  readonly log: string[] = [];
  readonly wrap = signal(false);
  readonly sort = signal<'name' | 'date'>('name');
}

describe('UiMenu', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('#trigger') as HTMLButtonElement;
    const overlay = () => document.querySelector('.cdk-overlay-container') as HTMLElement;
    const menus = () => Array.from(document.querySelectorAll<HTMLElement>('.ui-menu'));
    const item = (text: string) =>
      Array.from(document.querySelectorAll<HTMLElement>('.ui-menu-item')).find(
        (el) => el.textContent?.includes(text),
      ) as HTMLElement;
    const openWithKeyboard = async () => {
      trigger.focus();
      press(trigger, 'ArrowDown');
      await fixture.whenStable();
    };
    return { fixture, host: fixture.componentInstance, trigger, overlay, menus, item, openWithKeyboard };
  }

  afterEach(() => document.querySelector('.cdk-overlay-container')?.replaceChildren());

  it('wires the trigger to the menu with ARIA', async () => {
    const { fixture, trigger, menus } = await setup();
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('type')).toBe('button');

    trigger.click();
    await fixture.whenStable();
    const [menu] = menus();
    expect(menu.getAttribute('role')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(menu.id);
  });

  it('opens with ArrowDown and focuses the first item', async () => {
    const { openWithKeyboard, item } = await setup();
    await openWithKeyboard();
    expect(document.activeElement).toBe(item('Rename'));
    expect(item('Rename').getAttribute('role')).toBe('menuitem');
  });

  it('moves with arrows (disabled items stay focusable) and supports Home/End', async () => {
    const { openWithKeyboard, item } = await setup();
    await openWithKeyboard();
    press(item('Rename'), 'ArrowDown');
    expect(document.activeElement).toBe(item('Duplicate'));
    press(item('Duplicate'), 'ArrowDown');
    const archive = item('Archive');
    expect(document.activeElement).toBe(archive);
    expect(archive.getAttribute('aria-disabled')).toBe('true');
    expect(archive.hasAttribute('disabled')).toBe(false);
    press(archive, 'ArrowDown');
    expect(document.activeElement).toBe(item('Share'));
    press(item('Share'), 'End');
    expect(document.activeElement).toBe(item('Delete'));
    press(item('Delete'), 'Home');
    expect(document.activeElement).toBe(item('Rename'));
  });

  it('focuses items by typeahead', async () => {
    const { openWithKeyboard, item } = await setup();
    await openWithKeyboard();
    press(item('Rename'), 'd');
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(document.activeElement).toBe(item('Duplicate'));
  });

  it('opens a submenu with ArrowRight and closes it with ArrowLeft, returning focus', async () => {
    const { fixture, openWithKeyboard, item, menus } = await setup();
    await openWithKeyboard();
    const share = item('Share');
    share.focus();
    expect(share.getAttribute('aria-haspopup')).toBe('menu');
    expect(share.querySelector('.ui-menu-item__submenu-icon')).not.toBeNull();

    press(share, 'ArrowRight');
    await fixture.whenStable();
    expect(menus().length).toBe(2);
    expect(share.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(item('Copy link'));

    press(item('Copy link'), 'ArrowLeft');
    await fixture.whenStable();
    expect(menus().length).toBe(1);
    expect(document.activeElement).toBe(share);
  });

  it('closes a submenu with Escape, then the root menu, and returns focus to the trigger', async () => {
    const { fixture, openWithKeyboard, item, menus, trigger } = await setup();
    await openWithKeyboard();
    item('Share').focus();
    press(item('Share'), 'ArrowRight');
    await fixture.whenStable();

    press(item('Copy link'), 'Escape');
    await fixture.whenStable();
    expect(menus().length).toBe(1);
    expect(document.activeElement).toBe(item('Share'));

    press(item('Share'), 'Escape');
    await fixture.whenStable();
    expect(menus().length).toBe(0);
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('emits triggered and closes the menu on click', async () => {
    const { fixture, host, trigger, item, menus } = await setup();
    trigger.click();
    await fixture.whenStable();
    item('Delete').click();
    await fixture.whenStable();
    expect(host.log).toEqual(['delete']);
    expect(menus().length).toBe(0);
    expect(item('Delete')).toBeUndefined();
  });

  it('does not trigger disabled items', async () => {
    const { fixture, host, trigger, item } = await setup();
    trigger.click();
    await fixture.whenStable();
    item('Archive').click();
    expect(host.log).toEqual([]);
  });

  it('renders icons and hides the shortcut hint from assistive tech', async () => {
    const { fixture, trigger, item } = await setup();
    trigger.click();
    await fixture.whenStable();
    const duplicate = item('Duplicate');
    expect(duplicate.querySelector('.ui-menu-item__icon')?.getAttribute('aria-hidden')).toBe('true');
    expect(duplicate.querySelector('.ui-menu-item__shortcut')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('toggles checkbox items with two-way binding', async () => {
    const { fixture, host, trigger, item } = await setup();
    trigger.click();
    await fixture.whenStable();
    const wrap = item('Word wrap');
    expect(wrap.getAttribute('role')).toBe('menuitemcheckbox');
    expect(wrap.getAttribute('aria-checked')).toBe('false');
    wrap.click();
    await fixture.whenStable();
    expect(host.wrap()).toBe(true);

    trigger.click();
    await fixture.whenStable();
    expect(item('Word wrap').getAttribute('aria-checked')).toBe('true');
  });

  it('keeps the menu open when a checkbox is toggled with Space', async () => {
    const { fixture, host, openWithKeyboard, item, menus } = await setup();
    await openWithKeyboard();
    const wrap = item('Word wrap');
    wrap.focus();
    press(wrap, ' ');
    await fixture.whenStable();
    expect(host.wrap()).toBe(true);
    expect(menus().length).toBe(1);
    expect(wrap.getAttribute('aria-checked')).toBe('true');
  });

  it('selects one radio item per group', async () => {
    const { fixture, host, trigger, item } = await setup();
    trigger.click();
    await fixture.whenStable();
    expect(item('Name').getAttribute('role')).toBe('menuitemradio');
    expect(item('Name').getAttribute('aria-checked')).toBe('true');
    expect(item('Date').getAttribute('aria-checked')).toBe('false');
    expect(item('Name').closest('[role=group]')?.getAttribute('aria-label')).toBe('Sort by');

    item('Date').click();
    await fixture.whenStable();
    expect(host.sort()).toBe('date');
    trigger.click();
    await fixture.whenStable();
    expect(item('Name').getAttribute('aria-checked')).toBe('false');
    expect(item('Date').getAttribute('aria-checked')).toBe('true');
  });

  it('marks separators and destructive items', async () => {
    const { fixture, trigger, item } = await setup();
    trigger.click();
    await fixture.whenStable();
    expect(document.querySelector('.ui-menu-separator')?.getAttribute('role')).toBe('separator');
    expect(item('Delete').classList).toContain('ui-menu-item--destructive');
  });

  it('has no axe violations with nested menus open', async () => {
    const { fixture, openWithKeyboard, item, overlay } = await setup();
    await openWithKeyboard();
    item('Share').focus();
    press(item('Share'), 'ArrowRight');
    await fixture.whenStable();
    await expectNoAxeViolations(overlay());
    await expectNoAxeViolations(fixture.nativeElement);
  });
});
