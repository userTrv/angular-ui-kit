import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { UiCombobox } from '@usertrv/ui/combobox';
import { UiDatepicker } from '@usertrv/ui/datepicker';
import { UiControlValueAccessor } from '@usertrv/ui/forms';
import { UiSelect, UiSelectOption } from '@usertrv/ui/select';
import { expectNoAxeViolations } from '../test-utils';
import { UiError, UiFormField, UiHint, UiLabel } from './index';

function blur(el: HTMLElement): void {
  el.dispatchEvent(new Event('blur'));
  el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
}

// select, combobox and datepicker provide UI_FORM_FIELD_CONTROL, so ui-form-field wires its label,
// hints, errors and required marker to them like it does for input[uiInput].
describe('UiFormField with kit controls', () => {
  @Component({
    imports: [UiFormField, UiLabel, UiHint, UiError, UiSelect, UiSelectOption, UiCombobox, UiDatepicker, UiControlValueAccessor, ReactiveFormsModule],
    template: `
      <form [formGroup]="group">
        <ui-form-field id="f-select">
          <ui-label>Fruit</ui-label>
          <ui-select formControlName="fruit" placeholder="Pick one">
            <ui-option value="apple">Apple</ui-option>
            <ui-option value="pear">Pear</ui-option>
          </ui-select>
          <ui-hint>Seasonal</ui-hint>
          <ui-error>Pick a fruit</ui-error>
        </ui-form-field>
        <ui-form-field id="f-combobox">
          <ui-label>City</ui-label>
          <ui-combobox formControlName="city" [options]="cities" />
          <ui-hint>Start typing</ui-hint>
          <ui-error>Choose a city</ui-error>
        </ui-form-field>
        <ui-form-field id="f-date">
          <ui-label>Start date</ui-label>
          <ui-datepicker formControlName="date" locale="en-US" />
          <ui-hint>MM/DD/YYYY</ui-hint>
          <ui-error>Enter a date</ui-error>
        </ui-form-field>
      </form>
    `,
  })
  class ReactiveHost {
    readonly cities = ['Berlin', 'Paris'];
    readonly group = new FormGroup({
      fruit: new FormControl<string | null>(null, Validators.required),
      city: new FormControl<string | null>(null, Validators.required),
      date: new FormControl<Date | null>(null, Validators.required),
    });
  }

  async function setup() {
    const fixture = TestBed.createComponent(ReactiveHost);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const field = (id: string) => el.querySelector(`#${id}`) as HTMLElement;
    return { fixture, el, field };
  }

  it('renders the field without its own box around a kit control', async () => {
    const { field } = await setup();
    for (const id of ['f-select', 'f-combobox', 'f-date']) {
      expect(field(id).classList).toContain('ui-form-field--bare');
    }
  });

  it('labels the select trigger through aria-labelledby and links the hint', async () => {
    const { field } = await setup();
    const f = field('f-select');
    const label = f.querySelector('label') as HTMLLabelElement;
    const trigger = f.querySelector('[role="combobox"]') as HTMLElement;
    const hint = f.querySelector('ui-hint') as HTMLElement;
    expect(trigger.getAttribute('aria-labelledby')).toBe(label.id);
    expect(label.htmlFor).toBe(trigger.id);
    expect(trigger.getAttribute('aria-describedby')).toBe(hint.id);
    expect(trigger.getAttribute('aria-required')).toBe('true');
    expect(label.querySelector('.ui-label__required')).not.toBeNull();
  });

  it('focuses the select trigger when its label is clicked', async () => {
    const { field } = await setup();
    const f = field('f-select');
    (f.querySelector('label') as HTMLLabelElement).click();
    expect(document.activeElement).toBe(f.querySelector('[role="combobox"]'));
  });

  it('points the label at the combobox and datepicker inputs', async () => {
    const { field } = await setup();
    for (const id of ['f-combobox', 'f-date']) {
      const f = field(id);
      const input = f.querySelector('input') as HTMLInputElement;
      const hint = f.querySelector('ui-hint') as HTMLElement;
      expect((f.querySelector('label') as HTMLLabelElement).htmlFor).toBe(input.id);
      expect(input.getAttribute('aria-describedby')).toBe(hint.id);
      expect(f.querySelector('.ui-label__required')).not.toBeNull();
    }
  });

  it('shows and links errors after the controls are touched', async () => {
    const { fixture, field } = await setup();
    expect(fixture.nativeElement.querySelector('ui-error')).toBeNull();
    const trigger = field('f-select').querySelector('[role="combobox"]') as HTMLElement;
    blur(trigger);
    for (const id of ['f-combobox', 'f-date']) blur(field(id).querySelector('input') as HTMLInputElement);
    await fixture.whenStable();

    const targets = [trigger, field('f-combobox').querySelector('input')!, field('f-date').querySelector('input')!];
    for (const [i, id] of ['f-select', 'f-combobox', 'f-date'].entries()) {
      const f = field(id);
      const error = f.querySelector('ui-error') as HTMLElement;
      expect(error, id).not.toBeNull();
      expect(f.classList).toContain('ui-form-field--invalid');
      expect(targets[i].getAttribute('aria-invalid')).toBe('true');
      expect(targets[i].getAttribute('aria-describedby')?.split(' ')[0]).toBe(error.id);
    }
  });

  it('has no axe violations', async () => {
    const { el } = await setup();
    await expectNoAxeViolations(el);
  });

  describe('with Signal Forms', () => {
    @Component({
      imports: [UiFormField, UiLabel, UiError, UiSelect, UiSelectOption, FormField],
      template: `
        <ui-form-field>
          <ui-label>Fruit</ui-label>
          <ui-select [formField]="f.fruit">
            <ui-option value="apple">Apple</ui-option>
          </ui-select>
          <ui-error>Pick a fruit</ui-error>
        </ui-form-field>
        <ui-form-field [invalid]="forced()">
          <ui-label>Forced</ui-label>
          <ui-select aria-describedby="extra">
            <ui-option value="a">A</ui-option>
          </ui-select>
          <ui-error>Forced error</ui-error>
        </ui-form-field>
        <p id="extra">Extra</p>
      `,
    })
    class SignalHost {
      readonly model = signal({ fruit: null as string | null });
      readonly f = form(this.model, (p) => required(p.fruit));
      readonly forced = signal<boolean | undefined>(undefined);
    }

    it('reads required and touched state from the field', async () => {
      const fixture = TestBed.createComponent(SignalHost);
      await fixture.whenStable();
      const el = fixture.nativeElement as HTMLElement;
      const trigger = el.querySelector('[role="combobox"]') as HTMLElement;
      expect(trigger.getAttribute('aria-required')).toBe('true');
      expect(el.querySelector('ui-error')).toBeNull();
      blur(trigger);
      await fixture.whenStable();
      expect(trigger.getAttribute('aria-invalid')).toBe('true');
      expect(el.querySelector('ui-error')).not.toBeNull();
    });

    it('honours the field invalid override and keeps own aria-describedby', async () => {
      const fixture = TestBed.createComponent(SignalHost);
      await fixture.whenStable();
      const el = fixture.nativeElement as HTMLElement;
      const trigger = el.querySelectorAll('[role="combobox"]')[1] as HTMLElement;
      expect(trigger.hasAttribute('aria-invalid')).toBe(false);
      fixture.componentInstance.forced.set(true);
      await fixture.whenStable();
      expect(trigger.getAttribute('aria-invalid')).toBe('true');
      const ids = trigger.getAttribute('aria-describedby')?.split(' ') ?? [];
      expect(ids[0]).toBe('extra');
      expect(ids).toContain(el.querySelectorAll('ui-error')[0].id);
    });
  });
});
