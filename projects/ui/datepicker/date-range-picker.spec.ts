import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { UiControlValueAccessor } from '@usertrv/ui/forms';
import { expectNoAxeViolations, press, typeInto } from '../test-utils';
import { UiDateRange, UiDateRangePicker } from './index';

@Component({
  imports: [UiDateRangePicker],
  template: `
    <span id="stay-label">Stay</span>
    <ui-date-range-picker
      aria-labelledby="stay-label"
      locale="de-DE"
      [minDate]="min"
      [(value)]="value"
      (touch)="touched = touched + 1"
    />
  `,
})
class Host {
  readonly min = new Date(2026, 8, 1);
  readonly value = signal<UiDateRange>({ start: new Date(2026, 8, 10), end: new Date(2026, 8, 14) });
  touched = 0;
}

const overlay = () => document.querySelector('.cdk-overlay-container') as HTMLElement;
const dialog = () => overlay()?.querySelector('[role=dialog]') as HTMLElement | null;

describe('UiDateRangePicker', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const [start, end] = Array.from(el.querySelectorAll('input')) as HTMLInputElement[];
    const toggle = el.querySelector('button') as HTMLButtonElement;
    const stable = () => fixture.whenStable();
    return { fixture, host: fixture.componentInstance, el, start, end, toggle, stable };
  }

  afterEach(() => overlay()?.replaceChildren());

  it('renders two labelled inputs in a labelled group', async () => {
    const { el, start, end, toggle } = await setup();
    const group = el.querySelector('[role=group]') as HTMLElement;
    expect(group.getAttribute('aria-labelledby')).toBe('stay-label');
    expect(el.querySelector('ui-date-range-picker')?.hasAttribute('aria-labelledby')).toBe(false);
    expect(start.getAttribute('aria-label')).toBe('Start date');
    expect(end.getAttribute('aria-label')).toBe('End date');
    expect(start.value).toBe('10.09.2026');
    expect(end.value).toBe('14.09.2026');
    expect(start.placeholder).toBe('DD.MM.YYYY');
    expect(toggle.getAttribute('aria-label')).toBe('Choose date range');
  });

  it('parses each input separately and flags an end before the start', async () => {
    const { host, start, end, stable } = await setup();
    typeInto(end, '5.9.2026');
    await stable();
    expect(host.value().end).toEqual(new Date(2026, 8, 5));
    expect(end.getAttribute('aria-invalid')).toBe('true');
    expect(start.hasAttribute('aria-invalid')).toBe(false);
    typeInto(start, '01.09.2026');
    await stable();
    expect(host.value()).toEqual({ start: new Date(2026, 8, 1), end: new Date(2026, 8, 5) });
    expect(end.hasAttribute('aria-invalid')).toBe(false);
    typeInto(start, '31.08.2026');
    await stable();
    expect(start.getAttribute('aria-invalid')).toBe('true'); // before minDate
  });

  it('picks a range in the popup and only commits it once complete', async () => {
    const { host, toggle, stable } = await setup();
    toggle.focus();
    toggle.click();
    await stable();
    expect(dialog()?.getAttribute('aria-label')).toBe('Choose date range');
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Donnerstag, 10. September 2026');
    // Grid starts on Monday for de-DE.
    expect(overlay().querySelector('[role=columnheader] .ui-sr-only')?.textContent).toBe('Montag');

    press(document.activeElement!, 'ArrowRight');
    await stable();
    press(document.activeElement!, 'Enter'); // new start: 11th
    await stable();
    expect(host.value().start).toEqual(new Date(2026, 8, 10)); // not committed yet
    press(document.activeElement!, 'ArrowDown');
    await stable();
    expect(overlay().querySelectorAll('.ui-calendar__cell--preview').length).toBe(8);
    press(document.activeElement!, 'Enter'); // end: 18th
    await stable();
    expect(host.value()).toEqual({ start: new Date(2026, 8, 11), end: new Date(2026, 8, 18) });
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(toggle);
    expect(host.touched).toBe(1);
  });

  it('discards a half-picked range on Escape', async () => {
    const { host, toggle, stable } = await setup();
    toggle.click();
    await stable();
    press(document.activeElement!, 'Enter');
    await stable();
    press(document.activeElement!, 'Escape');
    await stable();
    expect(dialog()).toBeNull();
    expect(host.value()).toEqual({ start: new Date(2026, 8, 10), end: new Date(2026, 8, 14) });
  });

  it('has no axe violations with the calendar open', async () => {
    const { el, toggle, stable } = await setup();
    await expectNoAxeViolations(el);
    toggle.click();
    await stable();
    await expectNoAxeViolations(overlay());
  });
});

@Component({
  imports: [UiDateRangePicker, UiControlValueAccessor, ReactiveFormsModule, FormsModule, FormField],
  template: `
    <ui-date-range-picker locale="en-US" aria-label="Reactive" [formControl]="ctrl" />
    <ui-date-range-picker locale="en-US" aria-label="Template" [(ngModel)]="plain" />
    <ui-date-range-picker locale="en-US" aria-label="Signal" [formField]="signalForm.trip" />
  `,
})
class FormsHost {
  readonly ctrl = new FormControl<UiDateRange>({ start: new Date(2026, 0, 2), end: null }, { nonNullable: true });
  plain: UiDateRange = { start: null, end: new Date(2026, 0, 3) };
  readonly model = signal({ trip: { start: new Date(2026, 0, 4), end: new Date(2026, 0, 6) } as UiDateRange });
  readonly signalForm = form(this.model);
}

describe('UiDateRangePicker forms integration', () => {
  it('works with FormControl, ngModel and [formField]', async () => {
    const fixture = TestBed.createComponent(FormsHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const inputs = Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[];
    expect(inputs.map((i) => i.value)).toEqual(['01/02/2026', '', '', '01/03/2026', '01/04/2026', '01/06/2026']);

    typeInto(inputs[1], '01/09/2026');
    inputs[1].dispatchEvent(new Event('blur'));
    typeInto(inputs[2], '01/01/2026');
    typeInto(inputs[5], '01/08/2026');
    await fixture.whenStable();

    expect(host.ctrl.value).toEqual({ start: new Date(2026, 0, 2), end: new Date(2026, 0, 9) });
    expect(host.ctrl.touched).toBe(true);
    expect(host.plain).toEqual({ start: new Date(2026, 0, 1), end: new Date(2026, 0, 3) });
    expect(host.model().trip).toEqual({ start: new Date(2026, 0, 4), end: new Date(2026, 0, 8) });

    host.ctrl.disable();
    await fixture.whenStable();
    expect(inputs[0].disabled && inputs[1].disabled).toBe(true);
  });
});
