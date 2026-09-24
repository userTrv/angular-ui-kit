import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, email, form, required, submit } from '@angular/forms/signals';
import { expectNoAxeViolations, typeInto } from '../test-utils';
import { UiError, UiFormField, UiHint, UiInput, UiLabel, UiPrefix, UiTextareaAutosize } from './index';

function blur(el: HTMLElement): void {
  el.dispatchEvent(new Event('blur'));
  el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
}

describe('UiFormField', () => {
  describe('with Reactive Forms', () => {
    @Component({
      imports: [UiFormField, UiInput, UiLabel, UiHint, UiError, UiPrefix, ReactiveFormsModule],
      template: `
        <form [formGroup]="group" (ngSubmit)="0">
          <ui-form-field>
            <ui-label>Email</ui-label>
            <span uiPrefix aria-hidden="true">@</span>
            <input uiInput formControlName="email" />
            <ui-hint>Work address</ui-hint>
            <ui-error>Enter your email</ui-error>
          </ui-form-field>
          <button type="submit">Send</button>
        </form>
      `,
    })
    class Host {
      readonly group = new FormGroup({ email: new FormControl('', Validators.required) });
    }

    async function setup() {
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      const el = fixture.nativeElement as HTMLElement;
      return {
        fixture,
        el,
        input: el.querySelector('input') as HTMLInputElement,
        label: el.querySelector('label') as HTMLLabelElement,
        hint: el.querySelector('ui-hint') as HTMLElement,
      };
    }

    it('associates label, hint and required state with the control', async () => {
      const { input, label, hint, el } = await setup();
      expect(input.id).toMatch(/^ui-input-/);
      expect(label.htmlFor).toBe(input.id);
      expect(input.getAttribute('aria-describedby')).toBe(hint.id);
      expect(input.getAttribute('aria-required')).toBe('true');
      expect(label.querySelector('.ui-label__required')?.getAttribute('aria-hidden')).toBe('true');
      expect(el.querySelector('ui-error')).toBeNull();
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('shows the error after the control is touched and links it', async () => {
      const { fixture, input, el } = await setup();
      blur(input);
      await fixture.whenStable();
      const error = el.querySelector('ui-error') as HTMLElement;
      expect(error).not.toBeNull();
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(input.getAttribute('aria-describedby')?.split(' ')[0]).toBe(error.id);
      expect(el.querySelector('ui-form-field')?.classList).toContain('ui-form-field--invalid');

      typeInto(input, 'kirill@example.com');
      await fixture.whenStable();
      expect(el.querySelector('ui-error')).toBeNull();
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('shows errors of untouched controls once the form is submitted', async () => {
      const { fixture, el, input } = await setup();
      (el.querySelector('button[type=submit]') as HTMLButtonElement).click();
      await fixture.whenStable();
      expect(el.querySelector('ui-error')).not.toBeNull();
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('focuses the control when the box padding or prefix is clicked', async () => {
      const { el, input } = await setup();
      (el.querySelector('[uiPrefix]') as HTMLElement).click();
      expect(document.activeElement).toBe(input);
    });

    it('has no axe violations with the error shown', async () => {
      const { fixture, el, input } = await setup();
      blur(input);
      await fixture.whenStable();
      await expectNoAxeViolations(el);
    });
  });

  describe('with Signal Forms', () => {
    @Component({
      imports: [UiFormField, UiInput, UiLabel, UiError, FormField],
      template: `
        <ui-form-field>
          <ui-label>Email</ui-label>
          <input uiInput type="email" [formField]="profile.email" />
          @if (profile.email().getError('email')) {
            <ui-error>That does not look like an email address</ui-error>
          } @else {
            <ui-error>Email is required</ui-error>
          }
        </ui-form-field>
      `,
    })
    class Host {
      readonly model = signal({ email: '' });
      readonly profile = form(this.model, (p) => {
        required(p.email);
        email(p.email);
      });
    }

    it('reads required, invalid and touched from the field state', async () => {
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      const el = fixture.nativeElement as HTMLElement;
      const input = el.querySelector('input') as HTMLInputElement;
      expect(input.required).toBe(true);
      expect(input.getAttribute('aria-required')).toBe('true');
      expect(el.querySelector('ui-error')).toBeNull();

      typeInto(input, 'not-an-email');
      blur(input);
      await fixture.whenStable();
      expect(fixture.componentInstance.model().email).toBe('not-an-email');
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(el.querySelector('ui-error')?.textContent).toContain('does not look like');
      expect(input.getAttribute('aria-describedby')).toBe(el.querySelector('ui-error')?.id);
      await expectNoAxeViolations(el);
    });

    it('shows errors after submit() marks the form as touched', async () => {
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      const el = fixture.nativeElement as HTMLElement;
      await submit(fixture.componentInstance.profile, async () => undefined);
      await fixture.whenStable();
      expect(el.querySelector('ui-error')?.textContent).toContain('required');
    });
  });

  describe('with ngModel and manual state', () => {
    @Component({
      imports: [UiFormField, UiInput, UiLabel, UiError, UiTextareaAutosize, FormsModule],
      template: `
        <ui-form-field size="sm">
          <ui-label>Name</ui-label>
          <input uiInput name="name" required [(ngModel)]="name" />
          <ui-error>Name is required</ui-error>
        </ui-form-field>
        <ui-form-field [invalid]="forced()">
          <ui-label>Coupon</ui-label>
          <input uiInput id="coupon" aria-describedby="coupon-help" />
          <ui-error>This coupon has expired</ui-error>
        </ui-form-field>
        <p id="coupon-help">Codes are case-sensitive</p>
        <ui-form-field>
          <ui-label>Bio</ui-label>
          <textarea uiInput autosize minRows="2" maxRows="6"></textarea>
        </ui-form-field>
      `,
    })
    class Host {
      name = '';
      readonly forced = signal<boolean | undefined>(undefined);
    }

    it('supports template-driven forms and the native required attribute', async () => {
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      const el = fixture.nativeElement as HTMLElement;
      const input = el.querySelector('input[name=name]') as HTMLInputElement;
      expect(el.querySelector('ui-form-field')?.classList).toContain('ui-form-field--sm');
      expect(input.getAttribute('aria-required')).toBe('true');
      blur(input);
      await fixture.whenStable();
      expect(input.getAttribute('aria-invalid')).toBe('true');
      typeInto(input, 'Kirill');
      await fixture.whenStable();
      expect(fixture.componentInstance.name).toBe('Kirill');
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('lets [invalid] force the error state and keeps a custom id and aria-describedby', async () => {
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      const el = fixture.nativeElement as HTMLElement;
      const input = el.querySelector('#coupon') as HTMLInputElement;
      expect(el.querySelector('label[for=coupon]')).not.toBeNull();
      expect(input.getAttribute('aria-describedby')).toBe('coupon-help');
      fixture.componentInstance.forced.set(true);
      await fixture.whenStable();
      expect(input.getAttribute('aria-invalid')).toBe('true');
      const error = el.querySelectorAll('ui-error')[0] as HTMLElement;
      expect(error.textContent).toContain('expired');
      expect(input.getAttribute('aria-describedby')).toBe(`coupon-help ${error.id}`);
    });

    it('auto-sizes a textarea with the CDK directive', async () => {
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
      const cdk = fixture.debugElement.query((d) => d.nativeElement === textarea).injector.get(CdkTextareaAutosize);
      expect(cdk.enabled).toBe(true);
      expect(cdk.minRows).toBe(2);
      expect(cdk.maxRows).toBe(6);
      expect(textarea.classList).toContain('cdk-textarea-autosize');
      await expectNoAxeViolations(fixture.nativeElement);
    });
  });
});
