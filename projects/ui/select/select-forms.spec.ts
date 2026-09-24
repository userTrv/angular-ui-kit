import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { UiControlValueAccessor } from '@usertrv/ui/forms';
import { press } from '../test-utils';
import { UiSelect, UiSelectOption } from './index';

@Component({
  imports: [UiSelect, UiSelectOption, UiControlValueAccessor, ReactiveFormsModule, FormsModule, FormField],
  template: `
    <ui-select aria-label="Reactive" [formControl]="ctrl">
      <ui-option value="s">Small</ui-option>
      <ui-option value="m">Medium</ui-option>
    </ui-select>
    <ui-select aria-label="Template" [(ngModel)]="size">
      <ui-option value="s">Small</ui-option>
      <ui-option value="m">Medium</ui-option>
    </ui-select>
    <ui-select aria-label="Signal" [formField]="order.size">
      <ui-option value="s">Small</ui-option>
      <ui-option value="m">Medium</ui-option>
    </ui-select>
  `,
})
class Host {
  readonly ctrl = new FormControl<string | null>('s', Validators.required);
  size: string | null = 'm';
  readonly model = signal({ size: '' });
  readonly order = form(this.model, (p) => required(p.size));
}

describe('UiSelect forms integration', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const triggers = Array.from(fixture.nativeElement.querySelectorAll('[role=combobox]')) as HTMLElement[];
    return { fixture, host: fixture.componentInstance, triggers };
  }

  async function pickSecond(fixture: { whenStable(): Promise<unknown> }, trigger: HTMLElement) {
    press(trigger, 'Home');
    await fixture.whenStable();
    press(trigger, 'ArrowDown');
    press(trigger, 'Enter');
    await fixture.whenStable();
  }

  it('works with a FormControl through UiControlValueAccessor', async () => {
    const { fixture, host, triggers } = await setup();
    expect(triggers[0].textContent?.trim()).toBe('Small');
    expect(triggers[0].getAttribute('aria-required')).toBe('true');
    host.ctrl.setValue('m');
    await fixture.whenStable();
    expect(triggers[0].textContent?.trim()).toBe('Medium');
    expect(host.ctrl.dirty).toBe(false);

    host.ctrl.setValue('s');
    await fixture.whenStable();
    await pickSecond(fixture, triggers[0]);
    expect(host.ctrl.value).toBe('m');
    expect(host.ctrl.dirty).toBe(true);
    expect(host.ctrl.touched).toBe(true);

    host.ctrl.disable();
    await fixture.whenStable();
    expect(triggers[0].getAttribute('aria-disabled')).toBe('true');
  });

  it('works with ngModel', async () => {
    const { fixture, host, triggers } = await setup();
    await fixture.whenStable();
    expect(triggers[1].textContent?.trim()).toBe('Medium');
    press(triggers[1], 'Home');
    await fixture.whenStable();
    press(triggers[1], 'Enter');
    await fixture.whenStable();
    expect(host.size).toBe('s');
  });

  it('works with Signal Forms [formField] natively (required, invalid, touched)', async () => {
    const { fixture, host, triggers } = await setup();
    const trigger = triggers[2];
    expect(trigger.getAttribute('aria-required')).toBe('true');
    // Invalid (required, empty) but not shown before the user interacted with the field.
    expect(trigger.hasAttribute('aria-invalid')).toBe(false);
    trigger.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    await pickSecond(fixture, trigger);
    expect(host.model().size).toBe('m');
    expect(host.order.size().touched()).toBe(true);
    expect(trigger.hasAttribute('aria-invalid')).toBe(false);
  });
});
