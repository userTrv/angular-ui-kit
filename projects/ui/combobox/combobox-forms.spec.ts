import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { UiControlValueAccessor } from '@usertrv/ui/forms';
import { press, typeInto } from '../test-utils';
import { UiCombobox } from './index';

const LANGUAGES = ['TypeScript', 'JavaScript', 'Rust', 'Go'];

@Component({
  imports: [UiCombobox, UiControlValueAccessor, ReactiveFormsModule, FormsModule, FormField],
  template: `
    <ui-combobox aria-label="Reactive" [options]="languages" [formControl]="ctrl" />
    <ui-combobox aria-label="Template" [options]="languages" [(ngModel)]="plain" />
    <ui-combobox aria-label="Signal" [options]="languages" [formField]="profile.language" />
  `,
})
class Host {
  readonly languages = LANGUAGES;
  readonly ctrl = new FormControl<string | null>('Rust', Validators.required);
  plain: string | null = 'Go';
  readonly model = signal({ language: '' as string | null });
  readonly profile = form(this.model, (p) => required(p.language));
}

describe('UiCombobox forms integration', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const inputs = Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[];
    return { fixture, host: fixture.componentInstance, inputs };
  }

  async function choose(fixture: { whenStable(): Promise<unknown> }, input: HTMLInputElement, text: string) {
    typeInto(input, text);
    await fixture.whenStable();
    press(input, 'ArrowDown');
    press(input, 'Enter');
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  }

  it('works with a FormControl through UiControlValueAccessor', async () => {
    const { fixture, host, inputs } = await setup();
    expect(inputs[0].value).toBe('Rust');
    expect(inputs[0].getAttribute('aria-required')).toBe('true');
    host.ctrl.setValue('Go');
    await fixture.whenStable();
    expect(inputs[0].value).toBe('Go');
    expect(host.ctrl.dirty).toBe(false);

    await choose(fixture, inputs[0], 'type');
    expect(host.ctrl.value).toBe('TypeScript');
    expect(host.ctrl.dirty).toBe(true);
    expect(host.ctrl.touched).toBe(true);

    host.ctrl.disable();
    await fixture.whenStable();
    expect(inputs[0].disabled).toBe(true);
  });

  it('works with ngModel', async () => {
    const { fixture, host, inputs } = await setup();
    await fixture.whenStable();
    expect(inputs[1].value).toBe('Go');
    await choose(fixture, inputs[1], 'java');
    expect(host.plain).toBe('JavaScript');
  });

  it('works with Signal Forms [formField] natively', async () => {
    const { fixture, host, inputs } = await setup();
    expect(inputs[2].getAttribute('aria-required')).toBe('true');
    expect(inputs[2].hasAttribute('aria-invalid')).toBe(false);
    inputs[2].dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(inputs[2].getAttribute('aria-invalid')).toBe('true');
    await choose(fixture, inputs[2], 'rus');
    expect(host.model().language).toBe('Rust');
    expect(host.profile.language().touched()).toBe(true);
    expect(inputs[2].hasAttribute('aria-invalid')).toBe(false);
  });
});
