import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { expectNoAxeViolations, press, typeInto } from '../test-utils';
import { UiCombobox } from './index';

interface Country {
  code: string;
  name: string;
}

const COUNTRIES: Country[] = [
  { code: 'AR', name: 'Argentina' },
  { code: 'AM', name: 'Armenia' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'BR', name: 'Brazil' },
];

@Component({
  imports: [UiCombobox],
  template: `
    <label for="country-input">Country</label>
    <ui-combobox
      inputId="country-input"
      placeholder="Start typing"
      [options]="countries"
      [displayWith]="name"
      [compareWith]="byCode"
      [freeText]="freeText()"
      [(value)]="country"
      (touch)="touched = touched + 1"
    />
    <button type="button">Next</button>
  `,
})
class Host {
  readonly countries = COUNTRIES;
  readonly country = signal<Country | null>(null);
  readonly freeText = signal(false);
  readonly name = (c: Country) => c.name;
  readonly byCode = (a: Country, b: Country) => a.code === b.code;
  touched = 0;
}

describe('UiCombobox (static options)', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let input: HTMLInputElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
    input = fixture.nativeElement.querySelector('input[role=combobox]');
  });

  const stable = () => fixture.whenStable();
  const key = async (k: string, init?: KeyboardEventInit) => {
    const event = press(input, k, init);
    await stable();
    return event;
  };
  const type = async (text: string) => {
    typeInto(input, text);
    await stable();
  };
  const listbox = () => document.getElementById(input.getAttribute('aria-controls') ?? '') as HTMLElement;
  const optionTexts = () => Array.from(listbox().querySelectorAll('[role=option]')).map((o) => o.textContent?.trim());
  const activeText = () =>
    document.getElementById(input.getAttribute('aria-activedescendant') ?? '')?.textContent?.trim();

  it('renders an ARIA 1.2 combobox input labelled by <label for>', () => {
    expect(input.id).toBe('country-input');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.getAttribute('autocomplete')).toBe('off');
    expect(listbox().getAttribute('role')).toBe('listbox');
    expect(input.hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('filters as the user types, highlights the match and keeps focus in the input', async () => {
    input.focus();
    await type('arg');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(optionTexts()).toEqual(['Argentina']);
    expect(listbox().querySelector('mark')?.textContent).toBe('Arg');
    expect(document.querySelector('.cdk-overlay-container')?.contains(listbox())).toBe(true);
    expect(document.activeElement).toBe(input);
  });

  it('moves the active option with arrows (wrapping) and selects with Enter', async () => {
    await type('a');
    expect(input.hasAttribute('aria-activedescendant')).toBe(false);
    await key('ArrowDown');
    expect(activeText()).toBe('Argentina');
    await key('ArrowUp');
    expect(activeText()).toBe('Brazil');
    await key('ArrowDown');
    await key('ArrowDown');
    expect(activeText()).toBe('Armenia');
    const enter = await key('Enter');
    expect(enter.defaultPrevented).toBe(true);
    expect(host.country()).toEqual(COUNTRIES[1]);
    expect(input.value).toBe('Armenia');
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens with ArrowDown on the first option and with Alt+ArrowDown without highlighting', async () => {
    await key('ArrowDown', { altKey: true });
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(optionTexts()).toHaveLength(5);
    expect(input.hasAttribute('aria-activedescendant')).toBe(false);
    await key('ArrowUp', { altKey: true });
    expect(input.getAttribute('aria-expanded')).toBe('false');
    await key('ArrowDown');
    expect(activeText()).toBe('Argentina');
  });

  it('closes on the first Escape and clears on the second', async () => {
    host.country.set(COUNTRIES[4]);
    await stable();
    expect(input.value).toBe('Brazil');
    await key('ArrowDown');
    await key('Escape');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.value).toBe('Brazil');
    await key('Escape');
    expect(input.value).toBe('');
    expect(host.country()).toBeNull();
  });

  it('marks the selected option with aria-selected (compareWith)', async () => {
    host.country.set({ code: 'AT', name: 'Austria' });
    await stable();
    await key('ArrowDown', { altKey: true });
    const selected = listbox().querySelector('[aria-selected=true]');
    expect(selected?.textContent?.trim()).toBe('Austria');
  });

  it('selects with a click', async () => {
    await type('bra');
    const option = listbox().querySelector('[role=option]') as HTMLElement;
    option.click();
    await stable();
    expect(host.country()?.code).toBe('BR');
  });

  it('shows "No results" when nothing matches', async () => {
    await type('zz');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(listbox().hidden).toBe(true);
    expect(document.querySelector('.ui-combobox__status')?.textContent?.trim()).toBe('No results');
  });

  it('forces a selection: unmatched text reverts on blur, exact text selects', async () => {
    host.country.set(COUNTRIES[0]);
    await stable();
    await type('Atlantis');
    input.dispatchEvent(new Event('blur'));
    await stable();
    expect(input.value).toBe('Argentina');
    expect(host.touched).toBe(1);
    await type('austria');
    input.dispatchEvent(new Event('blur'));
    await stable();
    expect(host.country()?.code).toBe('AT');
    expect(input.value).toBe('Austria');
    await type('');
    input.dispatchEvent(new Event('blur'));
    await stable();
    expect(host.country()).toBeNull();
  });

  it('accepts free text when enabled', async () => {
    host.freeText.set(true);
    await stable();
    await type('Atlantis');
    await key('Enter');
    // freeText is meant for string values; this host types it as Country only to share the fixture.
    expect(host.country() as unknown).toBe('Atlantis');
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('announces the number of results', async () => {
    const announce = vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce').mockResolvedValue();
    await type('au');
    expect(announce).toHaveBeenLastCalledWith('2 results available');
    await type('aus');
    expect(announce).toHaveBeenLastCalledWith('2 results available');
    await type('austr');
    expect(announce).toHaveBeenLastCalledWith('2 results available');
    await type('austri');
    expect(announce).toHaveBeenLastCalledWith('1 result available');
  });

  it('has no axe violations while open', async () => {
    await type('a');
    await key('ArrowDown');
    await expectNoAxeViolations(document.body);
  });
});
