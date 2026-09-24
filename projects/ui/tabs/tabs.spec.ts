import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations, press } from '../test-utils';
import { UiTab, UiTabActivation, UiTabContent, UiTabGroup, UiTabLabel } from './index';
import { UiOrientation } from '@usertrv/ui/a11y';

let lazyCreated = 0;

@Component({
  selector: 'test-lazy-report',
  template: 'Report ready',
})
class LazyReport {
  constructor() {
    lazyCreated++;
  }
}

@Component({
  imports: [UiTabGroup, UiTab, UiTabLabel, UiTabContent, LazyReport],
  template: `
    <ui-tab-group
      aria-label="Project settings"
      [activation]="activation()"
      [orientation]="orientation()"
      [(selectedIndex)]="index"
    >
      <ui-tab label="General"><p>Project name and description.</p></ui-tab>
      <ui-tab>
        <ng-template uiTabLabel><span class="rich">Members</span> (3)</ng-template>
        <button type="button">Invite</button>
      </ui-tab>
      <ui-tab label="Billing" disabled>Invoices</ui-tab>
      <ui-tab label="Reports">
        <ng-template uiTabContent><test-lazy-report /></ng-template>
      </ui-tab>
    </ui-tab-group>
  `,
})
class Host {
  readonly activation = signal<UiTabActivation>('automatic');
  readonly orientation = signal<UiOrientation>('horizontal');
  readonly index = signal(0);
}

describe('UiTabGroup', () => {
  async function setup() {
    lazyCreated = 0;
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const tabs = Array.from(el.querySelectorAll<HTMLButtonElement>('[role=tab]'));
    const panels = Array.from(el.querySelectorAll<HTMLElement>('[role=tabpanel]'));
    const tablist = el.querySelector('[role=tablist]') as HTMLElement;
    return { fixture, host: fixture.componentInstance, el, tabs, panels, tablist };
  }

  it('renders the APG tabs structure', async () => {
    const { el, tabs, panels, tablist } = await setup();
    expect(tablist.getAttribute('aria-label')).toBe('Project settings');
    expect(el.querySelector('ui-tab-group')?.hasAttribute('aria-label')).toBe(false);
    expect(tablist.getAttribute('aria-orientation')).toBe('horizontal');
    expect(tabs.length).toBe(4);
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false', 'false']);
    tabs.forEach((tab, i) => {
      expect(tab.getAttribute('aria-controls')).toBe(panels[i].id);
      expect(panels[i].getAttribute('aria-labelledby')).toBe(tab.id);
    });
    expect(panels.map((p) => p.hidden)).toEqual([false, true, true, true]);
    expect(tabs[2].getAttribute('aria-disabled')).toBe('true');
  });

  it('renders rich labels from uiTabLabel', async () => {
    const { tabs } = await setup();
    expect(tabs[1].querySelector('.rich')?.textContent).toBe('Members');
  });

  it('keeps only the selected tab in the tab order', async () => {
    const { fixture, host, tabs } = await setup();
    expect(tabs.map((t) => t.tabIndex)).toEqual([0, -1, -1, -1]);
    host.index.set(3);
    await fixture.whenStable();
    expect(tabs.map((t) => t.tabIndex)).toEqual([-1, -1, -1, 0]);
  });

  it('selects on arrow keys in automatic mode, skipping disabled tabs', async () => {
    const { fixture, host, tabs, panels } = await setup();
    tabs[0].focus();
    press(tabs[0], 'ArrowRight');
    await fixture.whenStable();
    expect(document.activeElement).toBe(tabs[1]);
    expect(host.index()).toBe(1);
    expect(panels[1].hidden).toBe(false);

    press(tabs[1], 'ArrowRight');
    await fixture.whenStable();
    expect(document.activeElement).toBe(tabs[3]);
    expect(host.index()).toBe(3);

    press(tabs[3], 'ArrowRight');
    await fixture.whenStable();
    expect(document.activeElement).toBe(tabs[0]);
    expect(host.index()).toBe(0);
  });

  it('supports Home and End', async () => {
    const { fixture, host, tabs } = await setup();
    tabs[0].focus();
    press(tabs[0], 'End');
    await fixture.whenStable();
    expect(host.index()).toBe(3);
    press(tabs[3], 'Home');
    await fixture.whenStable();
    expect(host.index()).toBe(0);
  });

  it('only moves focus in manual mode; Enter/Space (native click) selects', async () => {
    const { fixture, host, tabs } = await setup();
    host.activation.set('manual');
    await fixture.whenStable();
    tabs[0].focus();
    press(tabs[0], 'ArrowRight');
    await fixture.whenStable();
    expect(document.activeElement).toBe(tabs[1]);
    expect(host.index()).toBe(0);
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');

    tabs[1].click();
    await fixture.whenStable();
    expect(host.index()).toBe(1);
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
  });

  it('uses Up/Down in vertical orientation', async () => {
    const { fixture, host, tabs, tablist } = await setup();
    host.orientation.set('vertical');
    await fixture.whenStable();
    expect(tablist.getAttribute('aria-orientation')).toBe('vertical');
    tabs[0].focus();
    press(tabs[0], 'ArrowRight');
    await fixture.whenStable();
    expect(host.index()).toBe(0);
    press(tabs[0], 'ArrowDown');
    await fixture.whenStable();
    expect(host.index()).toBe(1);
    press(tabs[1], 'ArrowUp');
    await fixture.whenStable();
    expect(host.index()).toBe(0);
  });

  it('ignores clicks on disabled tabs', async () => {
    const { fixture, host, tabs } = await setup();
    tabs[2].click();
    await fixture.whenStable();
    expect(host.index()).toBe(0);
  });

  it('instantiates uiTabContent lazily and destroys it when deselected', async () => {
    const { fixture, host, panels } = await setup();
    expect(lazyCreated).toBe(0);
    expect(panels[3].textContent?.trim()).toBe('');
    host.index.set(3);
    await fixture.whenStable();
    expect(lazyCreated).toBe(1);
    expect(panels[3].textContent).toContain('Report ready');
    host.index.set(0);
    await fixture.whenStable();
    expect(panels[3].textContent?.trim()).toBe('');
  });

  it('makes a panel focusable only when it has no focusable content', async () => {
    const { fixture, host, panels } = await setup();
    expect(panels[0].getAttribute('tabindex')).toBe('0');
    host.index.set(1);
    await fixture.whenStable();
    expect(panels[1].hasAttribute('tabindex')).toBe(false);
    expect(panels[0].hasAttribute('tabindex')).toBe(false);
  });

  it('clamps an out-of-range selectedIndex', async () => {
    const { fixture, host, tabs } = await setup();
    host.index.set(10);
    await fixture.whenStable();
    expect(tabs[3].getAttribute('aria-selected')).toBe('true');
  });

  it('has no axe violations', async () => {
    const { fixture, host } = await setup();
    await expectNoAxeViolations(fixture.nativeElement);
    host.orientation.set('vertical');
    host.index.set(3);
    await fixture.whenStable();
    await expectNoAxeViolations(fixture.nativeElement);
  });
});
