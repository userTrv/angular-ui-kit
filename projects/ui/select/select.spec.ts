import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { expectNoAxeViolations, press } from '../test-utils';
import { UiSelect, UiSelectOption, UiSelectOptionGroup } from './index';

interface Plan {
  id: number;
  name: string;
}

@Component({
  imports: [UiSelect, UiSelectOption, UiSelectOptionGroup],
  template: `
    <span id="tz-label">Time zone</span>
    <ui-select
      aria-labelledby="tz-label"
      placeholder="Pick a time zone"
      [disabled]="disabled()"
      [invalid]="invalid()"
      [(value)]="zone"
      (touch)="touched = touched + 1"
    >
      <ui-optgroup label="Europe">
        <ui-option value="Europe/Berlin">Berlin</ui-option>
        <ui-option value="Europe/Kyiv" disabled>Kyiv</ui-option>
        <ui-option value="Europe/Lisbon">Lisbon</ui-option>
      </ui-optgroup>
      <ui-optgroup label="Asia">
        <ui-option value="Asia/Tokyo">Tokyo</ui-option>
        <ui-option value="Asia/Tbilisi">Tbilisi</ui-option>
      </ui-optgroup>
    </ui-select>

    <ui-select aria-label="Plans" [compareWith]="byId" [(value)]="plan">
      @for (p of plans; track p.id) {
        <ui-option [value]="p">{{ p.name }}</ui-option>
      }
    </ui-select>

    <ui-select aria-label="Tags" multiple [(value)]="tags">
      <ui-option value="bug">Bug</ui-option>
      <ui-option value="docs">Docs</ui-option>
      <ui-option value="ux">UX</ui-option>
    </ui-select>
    <button type="button">After</button>
  `,
})
class Host {
  readonly zone = signal<string | null>(null);
  readonly plan = signal<Plan | null>({ id: 2, name: 'Team (copy)' });
  readonly tags = signal<readonly string[]>(['docs']);
  readonly disabled = signal(false);
  readonly invalid = signal(false);
  readonly plans: Plan[] = [
    { id: 1, name: 'Free' },
    { id: 2, name: 'Team' },
    { id: 3, name: 'Enterprise' },
  ];
  readonly byId = (a: Plan, b: Plan) => a.id === b.id;
  touched = 0;
}

const overlay = () => document.querySelector('.cdk-overlay-container') as HTMLElement | null;
const activeText = (trigger: HTMLElement) =>
  document.getElementById(trigger.getAttribute('aria-activedescendant') ?? '')?.textContent?.trim();

describe('UiSelect', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let triggers: HTMLElement[];

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
    triggers = Array.from(fixture.nativeElement.querySelectorAll('[role=combobox]'));
  });

  const stable = () => fixture.whenStable();
  const key = async (el: HTMLElement, k: string, init?: KeyboardEventInit) => {
    const event = press(el, k, init);
    await stable();
    return event;
  };

  it('exposes the APG select-only combobox attributes while closed', () => {
    const [trigger] = triggers;
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-labelledby')).toBe('tz-label');
    expect(trigger.hasAttribute('aria-activedescendant')).toBe(false);
    expect(trigger.tabIndex).toBe(0);
    const listbox = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
    expect(listbox?.getAttribute('role')).toBe('listbox');
    expect(trigger.textContent?.trim()).toBe('Pick a time zone');
    const selectHost = fixture.nativeElement.querySelector('ui-select') as HTMLElement;
    expect(selectHost.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('opens on click into an overlay and highlights the first enabled option', async () => {
    const [trigger] = triggers;
    trigger.click();
    await stable();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const listbox = overlay()?.querySelector('[role=listbox]');
    expect(listbox?.id).toBe(trigger.getAttribute('aria-controls'));
    expect(activeText(trigger)).toBe('Berlin');
    trigger.click();
    await stable();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it.each([['ArrowDown'], ['ArrowUp'], ['Enter'], [' ']])('opens with %j', async (k) => {
    const [trigger] = triggers;
    const event = await key(trigger, k);
    expect(event.defaultPrevented).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('opens on the first / last option with Home / End', async () => {
    const [trigger] = triggers;
    await key(trigger, 'End');
    expect(activeText(trigger)).toBe('Tbilisi');
    await key(trigger, 'Escape');
    await key(trigger, 'Home');
    expect(activeText(trigger)).toBe('Berlin');
  });

  it('navigates with arrows skipping disabled options, selects with Enter and closes', async () => {
    const [trigger] = triggers;
    trigger.focus();
    await key(trigger, 'ArrowDown');
    await key(trigger, 'ArrowDown');
    expect(activeText(trigger)).toBe('Lisbon');
    await key(trigger, 'Enter');
    expect(host.zone()).toBe('Europe/Lisbon');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.textContent?.trim()).toBe('Lisbon');
    expect(document.activeElement).toBe(trigger);
    await key(trigger, 'ArrowDown');
    expect(activeText(trigger)).toBe('Lisbon');
    const selected = overlay()?.querySelector('[aria-selected=true]');
    expect(selected?.textContent?.trim()).toBe('Lisbon');
  });

  it('closes with Escape without changing the value, and with Tab', async () => {
    const [trigger] = triggers;
    await key(trigger, 'ArrowDown');
    await key(trigger, 'ArrowDown');
    await key(trigger, 'Escape');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(host.zone()).toBeNull();
    await key(trigger, 'ArrowDown');
    const tab = await key(trigger, 'Tab');
    expect(tab.defaultPrevented).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('selects with a click on an option and keeps focus on the trigger', async () => {
    const [trigger] = triggers;
    trigger.focus();
    trigger.click();
    await stable();
    const tokyo = Array.from(overlay()?.querySelectorAll('[role=option]') ?? []).find(
      (o) => o.textContent?.trim() === 'Tokyo',
    ) as HTMLElement;
    const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    tokyo.dispatchEvent(mousedown);
    expect(mousedown.defaultPrevented).toBe(true);
    tokyo.click();
    await stable();
    expect(host.zone()).toBe('Asia/Tokyo');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  it('changes the value with typeahead while closed (like a native select)', async () => {
    const [trigger] = triggers;
    await key(trigger, 't');
    await key(trigger, 'b');
    await new Promise((resolve) => setTimeout(resolve, 250));
    await stable();
    expect(host.zone()).toBe('Asia/Tbilisi');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on an outside click and emits touch', async () => {
    const [trigger] = triggers;
    trigger.click();
    await stable();
    const outside = fixture.nativeElement.querySelector('button') as HTMLElement;
    outside.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await stable();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(host.touched).toBe(1);
  });

  it('emits touch on blur', async () => {
    const [trigger] = triggers;
    trigger.dispatchEvent(new Event('blur'));
    await stable();
    expect(host.touched).toBe(1);
  });

  it('matches object values with compareWith', async () => {
    const plans = triggers[1];
    expect(plans.textContent?.trim()).toBe('Team');
    await key(plans, 'ArrowDown');
    expect(activeText(plans)).toBe('Team');
  });

  it('toggles several values in multiple mode and stays open', async () => {
    const tags = triggers[2];
    expect(tags.textContent?.trim()).toBe('Docs');
    await key(tags, 'ArrowDown');
    const listbox = document.getElementById(tags.getAttribute('aria-controls') ?? '') as HTMLElement;
    expect(listbox.getAttribute('aria-multiselectable')).toBe('true');
    await key(tags, 'ArrowDown');
    await key(tags, ' ');
    expect(host.tags()).toEqual(['docs', 'ux']);
    expect(tags.getAttribute('aria-expanded')).toBe('true');
    await key(tags, 'ArrowUp');
    await key(tags, 'Enter');
    expect(host.tags()).toEqual(['ux']);
    expect(tags.textContent?.trim()).toBe('UX');
  });

  it('reflects disabled and invalid states', async () => {
    const [trigger] = triggers;
    host.disabled.set(true);
    host.invalid.set(true);
    await stable();
    expect(trigger.getAttribute('aria-disabled')).toBe('true');
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    expect(trigger.tabIndex).toBe(-1);
    trigger.click();
    await key(trigger, 'ArrowDown');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('has no axe violations while open', async () => {
    host.zone.set('Asia/Tokyo');
    triggers[0].click();
    await stable();
    await expectNoAxeViolations(document.body);
  });
});
