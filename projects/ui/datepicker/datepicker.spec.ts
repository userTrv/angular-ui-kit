import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, maxDate, minDate } from '@angular/forms/signals';
import { UiControlValueAccessor } from '@usertrv/ui/forms';
import { expectNoAxeViolations, press, typeInto } from '../test-utils';
import { UiDatepicker } from './index';

@Component({
  imports: [UiDatepicker],
  template: `
    <label for="due">Due date</label>
    <ui-datepicker
      inputId="due"
      locale="en-US"
      [(value)]="value"
      [min]="min()"
      [disabled]="disabled()"
      (touch)="touched = touched + 1"
    />
  `,
})
class Host {
  readonly value = signal<Date | null>(new Date(2026, 8, 24));
  readonly min = signal<Date | undefined>(undefined);
  readonly disabled = signal(false);
  touched = 0;
}

const overlay = () => document.querySelector('.cdk-overlay-container') as HTMLElement;
const dialog = () => overlay()?.querySelector('[role=dialog]') as HTMLElement | null;

describe('UiDatepicker', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector('input') as HTMLInputElement;
    const toggle = el.querySelector('button') as HTMLButtonElement;
    const stable = () => fixture.whenStable();
    return { fixture, host: fixture.componentInstance, el, input, toggle, stable };
  }

  async function open(toggle: HTMLButtonElement, stable: () => Promise<unknown>) {
    toggle.focus();
    toggle.click();
    await stable();
  }

  afterEach(() => {
    // Overlays live in document.body, outside the fixture.
    overlay()?.replaceChildren();
  });

  describe('text input', () => {
    it('shows the value in the locale format and labels the input', async () => {
      const { input } = await setup();
      expect(input.value).toBe('09/24/2026');
      expect(input.id).toBe('due');
      expect(input.placeholder).toBe('MM/DD/YYYY');
    });

    it('parses typed text into the value without rewriting it mid-typing', async () => {
      const { host, input, stable } = await setup();
      typeInto(input, '1/5/27');
      await stable();
      expect(host.value()).toEqual(new Date(2027, 0, 5));
      expect(input.value).toBe('1/5/27');
      input.dispatchEvent(new Event('blur'));
      await stable();
      expect(input.value).toBe('01/05/2027');
    });

    it('marks unparseable text invalid and clears the value', async () => {
      const { host, el, input, stable } = await setup();
      typeInto(input, '02/30/2026');
      await stable();
      expect(host.value()).toBeNull();
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(el.querySelector('ui-datepicker')?.classList).toContain('ui-datepicker--invalid');
      expect(input.value).toBe('02/30/2026');
      typeInto(input, '');
      await stable();
      expect(input.hasAttribute('aria-invalid')).toBe(false);
      expect(host.value()).toBeNull();
    });

    it('flags a typed date outside min as invalid', async () => {
      const { fixture, host, input, stable } = await setup();
      host.min.set(new Date(2026, 9, 1));
      await fixture.whenStable();
      expect(input.getAttribute('aria-invalid')).toBe('true');
      typeInto(input, '10/02/2026');
      await stable();
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('shows an externally set invalid state only after the control was touched', async () => {
      @Component({
        imports: [UiDatepicker],
        template: `<ui-datepicker aria-label="Start" invalid [touched]="touched()" />`,
      })
      class Invalid {
        readonly touched = signal(false);
      }
      const fixture = TestBed.createComponent(Invalid);
      await fixture.whenStable();
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      expect(input.hasAttribute('aria-invalid')).toBe(false);
      input.dispatchEvent(new Event('blur'));
      await fixture.whenStable();
      expect(input.getAttribute('aria-invalid')).toBe('true');
      fixture.componentInstance.touched.set(true);
      await fixture.whenStable();
      fixture.componentInstance.touched.set(false); // e.g. form reset
      await fixture.whenStable();
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('re-formats when the value changes from outside', async () => {
      const { fixture, host, input } = await setup();
      host.value.set(new Date(2030, 11, 31));
      await fixture.whenStable();
      expect(input.value).toBe('12/31/2030');
    });

    it('emits touch on blur', async () => {
      const { host, input, stable } = await setup();
      input.dispatchEvent(new Event('blur'));
      await stable();
      expect(host.touched).toBe(1);
    });
  });

  describe('popup', () => {
    it('describes the toggle button', async () => {
      const { toggle } = await setup();
      expect(toggle.getAttribute('aria-label')).toBe('Choose date');
      expect(toggle.getAttribute('aria-haspopup')).toBe('dialog');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
    });

    it('opens a modal dialog and moves focus to the selected date', async () => {
      const { toggle, stable } = await setup();
      await open(toggle, stable);
      const d = dialog()!;
      expect(d).not.toBeNull();
      expect(d.getAttribute('aria-modal')).toBe('true');
      expect(d.getAttribute('aria-label')).toBe('Choose date');
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(document.activeElement?.getAttribute('aria-label')).toBe('Thursday, September 24, 2026');
      expect(document.activeElement?.getAttribute('aria-selected')).toBe('true');
    });

    it('opens with Alt+ArrowDown from the input', async () => {
      const { input, stable } = await setup();
      press(input, 'ArrowDown', { altKey: true });
      await stable();
      expect(dialog()).not.toBeNull();
    });

    it('traps focus inside the dialog', async () => {
      const { toggle, stable } = await setup();
      await open(toggle, stable);
      const anchors = overlay().querySelectorAll('.cdk-focus-trap-anchor');
      expect(anchors.length).toBe(2);
    });

    it('closes on Escape and restores focus to the toggle without changing the value', async () => {
      const { host, toggle, stable } = await setup();
      await open(toggle, stable);
      press(document.activeElement!, 'ArrowRight');
      await stable();
      press(document.activeElement!, 'Escape');
      await stable();
      expect(dialog()).toBeNull();
      expect(document.activeElement).toBe(toggle);
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(host.value()).toEqual(new Date(2026, 8, 24));
      expect(host.touched).toBeGreaterThan(0);
    });

    it('selecting a date sets the value, closes and restores focus', async () => {
      const { host, input, toggle, stable } = await setup();
      await open(toggle, stable);
      press(document.activeElement!, 'ArrowDown');
      await stable();
      press(document.activeElement!, 'Enter');
      await stable();
      expect(host.value()).toEqual(new Date(2026, 9, 1));
      expect(input.value).toBe('10/01/2026');
      expect(dialog()).toBeNull();
      expect(document.activeElement).toBe(toggle);
    });

    it('closes on an outside click without stealing focus back', async () => {
      const { toggle, stable } = await setup();
      await open(toggle, stable);
      document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await stable();
      expect(dialog()).toBeNull();
    });

    it('cannot be opened while disabled', async () => {
      const { fixture, host, input, toggle } = await setup();
      host.disabled.set(true);
      await fixture.whenStable();
      expect(input.disabled).toBe(true);
      expect(toggle.disabled).toBe(true);
    });

    it('has no axe violations with the calendar open', async () => {
      const { el, toggle, stable } = await setup();
      await expectNoAxeViolations(el);
      await open(toggle, stable);
      await expectNoAxeViolations(overlay());
    });
  });
});

@Component({
  imports: [UiDatepicker, UiControlValueAccessor, ReactiveFormsModule, FormsModule, FormField],
  template: `
    <ui-datepicker locale="en-US" aria-label="Reactive" [formControl]="ctrl" />
    <ui-datepicker locale="en-US" aria-label="Template" [(ngModel)]="plain" />
    <ui-datepicker locale="en-US" aria-label="Signal" [formField]="signalForm.start" />
  `,
})
class FormsHost {
  readonly ctrl = new FormControl<Date | null>(new Date(2026, 0, 2));
  plain: Date | null = new Date(2026, 0, 3);
  readonly model = signal({ start: new Date(2026, 0, 4) as Date | null });
  readonly signalForm = form(this.model, (path) => {
    minDate(path.start, new Date(2026, 0, 1));
    maxDate(path.start, new Date(2026, 11, 31));
  });
}

describe('UiDatepicker forms integration', () => {
  async function setup() {
    const fixture = TestBed.createComponent(FormsHost);
    await fixture.whenStable();
    const inputs = Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[];
    return { fixture, host: fixture.componentInstance, inputs };
  }

  it('works with a FormControl through UiControlValueAccessor', async () => {
    const { fixture, host, inputs } = await setup();
    expect(inputs[0].value).toBe('01/02/2026');
    typeInto(inputs[0], '02/03/2026');
    inputs[0].dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(host.ctrl.value).toEqual(new Date(2026, 1, 3));
    expect(host.ctrl.dirty).toBe(true);
    expect(host.ctrl.touched).toBe(true);
    host.ctrl.disable();
    await fixture.whenStable();
    expect(inputs[0].disabled).toBe(true);
  });

  it('works with ngModel', async () => {
    const { fixture, host, inputs } = await setup();
    expect(inputs[1].value).toBe('01/03/2026');
    typeInto(inputs[1], '03/04/2026');
    await fixture.whenStable();
    expect(host.plain).toEqual(new Date(2026, 2, 4));
  });

  it('works with Signal Forms [formField], including minDate/maxDate and the invalid state', async () => {
    const { fixture, host, inputs } = await setup();
    expect(inputs[2].value).toBe('01/04/2026');
    const picker = fixture.debugElement.queryAll((d) => d.name === 'ui-datepicker')[2];
    expect(picker.injector.get(UiControlValueAccessor, null)).toBeNull();
    const component = picker.componentInstance as UiDatepicker;
    expect(component.min()).toEqual(new Date(2026, 0, 1));
    expect(component.max()).toEqual(new Date(2026, 11, 31));

    typeInto(inputs[2], '06/15/2027');
    await fixture.whenStable();
    expect(host.model().start).toEqual(new Date(2027, 5, 15));
    expect(host.signalForm.start().invalid()).toBe(true);
    expect(inputs[2].getAttribute('aria-invalid')).toBe('true');
  });
});
