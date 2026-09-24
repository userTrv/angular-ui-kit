import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { expectNoAxeViolations, press } from '../test-utils';
import { UiListbox, UiOption, UiOptionGroup } from './index';

@Component({
  imports: [UiListbox, UiOption, UiOptionGroup],
  template: `
    <div id="lbl">Fruit</div>
    <div
      uiListbox
      aria-labelledby="lbl"
      [uiListboxMultiple]="multiple()"
      [(uiListboxSelection)]="selection"
      (uiListboxPicked)="picked = picked + 1"
    >
      <div uiOption="apple">Apple</div>
      <div uiOption="banana" uiOptionDisabled>Banana</div>
      <div uiOption="blueberry">Blueberry</div>
      <div uiOptionGroup #citrus="uiOptionGroup">
        <div role="presentation" [id]="citrus.labelId">Citrus</div>
        <div uiOption="lemon">Lemon</div>
        <div uiOption="lime" uiOptionLabel="Lime (green)">Lime</div>
      </div>
    </div>
  `,
})
class Host {
  readonly multiple = signal(false);
  readonly selection = signal<readonly string[]>([]);
  picked = 0;
}

@Component({
  imports: [UiListbox, UiOption],
  template: `
    <input
      aria-label="Color"
      role="combobox"
      aria-expanded="true"
      [attr.aria-controls]="lb.id()"
      [attr.aria-activedescendant]="lb.activeDescendantId()"
      (keydown)="lb.handleKeydown($event)"
    />
    <div uiListbox #lb="uiListbox" uiListboxFocusMode="external" aria-label="Colors" [uiListboxTypeahead]="false">
      <div uiOption="red">Red</div>
      <div uiOption="green">Green</div>
    </div>
  `,
})
class ExternalHost {}

/** CDK typeahead collects keys for 200 ms before moving the active option. */
async function typeaheadDebounce(fixture: ComponentFixture<unknown>) {
  await new Promise((resolve) => setTimeout(resolve, 250));
  await fixture.whenStable();
}

describe('UiListbox', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const listbox = el.querySelector('[role=listbox]') as HTMLElement;
    const options = Array.from(el.querySelectorAll('[role=option]')) as HTMLElement[];
    return { fixture, host: fixture.componentInstance, listbox, options };
  }

  const activeText = (listbox: HTMLElement) =>
    document.getElementById(listbox.getAttribute('aria-activedescendant') ?? '')?.textContent?.trim();

  it('renders listbox and option roles with ids and states', async () => {
    const { listbox, options } = await setup();
    expect(listbox.getAttribute('tabindex')).toBe('0');
    expect(listbox.hasAttribute('aria-multiselectable')).toBe(false);
    expect(options).toHaveLength(5);
    expect(new Set(options.map((o) => o.id)).size).toBe(5);
    expect(options.map((o) => o.getAttribute('aria-selected'))).toEqual(['false', 'false', 'false', 'false', 'false']);
    expect(options[1].getAttribute('aria-disabled')).toBe('true');
    const group = listbox.querySelector('[role=group]') as HTMLElement;
    expect(document.getElementById(group.getAttribute('aria-labelledby') ?? '')?.textContent).toBe('Citrus');
  });

  it('activates the first option on focus and moves with arrows, skipping disabled options', async () => {
    const { fixture, listbox } = await setup();
    listbox.dispatchEvent(new Event('focus'));
    await fixture.whenStable();
    expect(activeText(listbox)).toBe('Apple');
    press(listbox, 'ArrowDown');
    await fixture.whenStable();
    expect(activeText(listbox)).toBe('Blueberry');
    press(listbox, 'ArrowUp');
    await fixture.whenStable();
    expect(activeText(listbox)).toBe('Apple');
  });

  it('does not wrap by default and supports Home/End/PageUp/PageDown', async () => {
    const { fixture, listbox } = await setup();
    listbox.dispatchEvent(new Event('focus'));
    press(listbox, 'ArrowUp');
    await fixture.whenStable();
    expect(activeText(listbox)).toBe('Apple');
    press(listbox, 'End');
    await fixture.whenStable();
    expect(activeText(listbox)).toBe('Lime');
    press(listbox, 'Home');
    await fixture.whenStable();
    expect(activeText(listbox)).toBe('Apple');
    press(listbox, 'PageDown');
    await fixture.whenStable();
    expect(activeText(listbox)).toBe('Lime');
    press(listbox, 'PageUp');
    await fixture.whenStable();
    expect(activeText(listbox)).toBe('Apple');
  });

  it('selects with Enter and Space and emits picked', async () => {
    const { fixture, host, listbox, options } = await setup();
    listbox.dispatchEvent(new Event('focus'));
    press(listbox, 'Enter');
    await fixture.whenStable();
    expect(host.selection()).toEqual(['apple']);
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    press(listbox, 'ArrowDown');
    press(listbox, ' ');
    await fixture.whenStable();
    expect(host.selection()).toEqual(['blueberry']);
    expect(options[0].getAttribute('aria-selected')).toBe('false');
    expect(host.picked).toBe(2);
  });

  it('toggles options in multiple mode', async () => {
    const { fixture, host, listbox, options } = await setup();
    host.multiple.set(true);
    await fixture.whenStable();
    expect(listbox.getAttribute('aria-multiselectable')).toBe('true');
    options[0].click();
    options[3].click();
    await fixture.whenStable();
    expect(host.selection()).toEqual(['apple', 'lemon']);
    options[0].click();
    await fixture.whenStable();
    expect(host.selection()).toEqual(['lemon']);
  });

  it('ignores clicks on disabled options', async () => {
    const { fixture, host, options } = await setup();
    options[1].click();
    await fixture.whenStable();
    expect(host.selection()).toEqual([]);
    expect(host.picked).toBe(0);
  });

  it('starts from the selected option and uses labels for typeahead', async () => {
    const { fixture, host, listbox } = await setup();
    host.selection.set(['lemon']);
    await fixture.whenStable();
    listbox.dispatchEvent(new Event('focus'));
    await fixture.whenStable();
    expect(activeText(listbox)).toBe('Lemon');
    press(listbox, 'l');
    press(listbox, 'i');
    await typeaheadDebounce(fixture);
    expect(activeText(listbox)).toBe('Lime');
    press(listbox, 'b');
    await typeaheadDebounce(fixture);
    expect(activeText(listbox)).toBe('Blueberry'); // Banana is disabled
  });

  it('can be driven from an external element through aria-activedescendant', async () => {
    const fixture = TestBed.createComponent(ExternalHost);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector('input') as HTMLInputElement;
    const listbox = el.querySelector('[role=listbox]') as HTMLElement;
    expect(listbox.hasAttribute('tabindex')).toBe(false);
    expect(input.getAttribute('aria-controls')).toBe(listbox.id);
    press(input, 'ArrowDown');
    await fixture.whenStable();
    expect(document.getElementById(input.getAttribute('aria-activedescendant') ?? '')?.textContent).toBe('Red');
    expect(listbox.hasAttribute('aria-activedescendant')).toBe(false);
    const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    listbox.querySelector('[role=option]')?.dispatchEvent(mousedown);
    expect(mousedown.defaultPrevented).toBe(true);
    const typed = press(input, 'g');
    expect(typed.defaultPrevented).toBe(false);
  });

  it('has no axe violations', async () => {
    const { fixture, host, listbox } = await setup();
    host.selection.set(['apple']);
    listbox.dispatchEvent(new Event('focus'));
    await fixture.whenStable();
    await expectNoAxeViolations(fixture.nativeElement);
  });
});
