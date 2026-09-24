import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { UiControlValueAccessor } from '@usertrv/ui/forms';
import { expectNoAxeViolations, press } from '../test-utils';
import { UiCheckbox } from './index';

function inputs(root: HTMLElement): HTMLInputElement[] {
  return Array.from(root.querySelectorAll('input[type=checkbox]'));
}

describe('UiCheckbox', () => {
  describe('standalone', () => {
    @Component({
      imports: [UiCheckbox],
      template: `
        <ui-checkbox [(checked)]="all" [indeterminate]="some()" (checkedChange)="toggleAll($event)">Select all</ui-checkbox>
        @for (item of items(); track item.id; let i = $index) {
          <ui-checkbox [checked]="item.done" (checkedChange)="setItem(i, $event)">{{ item.id }}</ui-checkbox>
        }
        <ui-checkbox disabled name="archived">Archived</ui-checkbox>
        <ui-checkbox aria-label="Star" invalid required />
      `,
    })
    class Host {
      readonly items = signal([
        { id: 'Design', done: false },
        { id: 'Build', done: false },
      ]);
      all = false;
      readonly some = computed(() => {
        const done = this.items().filter((i) => i.done).length;
        return done > 0 && done < this.items().length;
      });
      toggleAll(checked: boolean) {
        this.items.update((items) => items.map((i) => ({ ...i, done: checked })));
      }
      setItem(index: number, done: boolean) {
        this.items.update((items) => items.map((item, i) => (i === index ? { ...item, done } : item)));
        this.all = this.items().every((i) => i.done);
      }
    }

    async function setup() {
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      return { fixture, host: fixture.componentInstance, boxes: inputs(fixture.nativeElement) };
    }

    it('renders a native checkbox labelled by the projected content', async () => {
      const { boxes } = await setup();
      expect(boxes[0].closest('label')?.textContent).toContain('Select all');
      expect(boxes[0].checked).toBe(false);
      expect(boxes[0].id).toMatch(/^ui-checkbox-/);
    });

    it('toggles on click and emits checkedChange', async () => {
      const { fixture, host, boxes } = await setup();
      boxes[1].click();
      await fixture.whenStable();
      expect(host.items()[0].done).toBe(true);
      expect(fixture.nativeElement.querySelectorAll('ui-checkbox')[1].classList).toContain('ui-checkbox--checked');
    });

    it('drives a "select all" checkbox with the mixed state', async () => {
      const { fixture, host, boxes } = await setup();
      boxes[1].click();
      await fixture.whenStable();
      expect(boxes[0].indeterminate).toBe(true);
      expect(fixture.nativeElement.querySelector('ui-checkbox').classList).toContain('ui-checkbox--indeterminate');

      boxes[0].click(); // native click clears indeterminate and checks the box
      await fixture.whenStable();
      expect(boxes[0].indeterminate).toBe(false);
      expect(boxes[0].checked).toBe(true);
      expect(host.items().every((i) => i.done)).toBe(true);
    });

    it('toggles with Space through the native input (keyboard)', async () => {
      const { fixture, host, boxes } = await setup();
      boxes[2].focus();
      expect(document.activeElement).toBe(boxes[2]);
      // jsdom does not synthesise the click that browsers fire for Space on a checkbox,
      // so assert the key is not swallowed and simulate the browser's activation.
      const event = press(boxes[2], ' ');
      expect(event.defaultPrevented).toBe(false);
      boxes[2].click();
      await fixture.whenStable();
      expect(host.items()[1].done).toBe(true);
    });

    it('reflects disabled, name, invalid and required on the native input', async () => {
      const { boxes } = await setup();
      expect(boxes[3].disabled).toBe(true);
      expect(boxes[3].name).toBe('archived');
      expect(boxes[4].getAttribute('aria-label')).toBe('Star');
      expect(boxes[4].getAttribute('aria-invalid')).toBe('true');
      expect(boxes[4].getAttribute('aria-required')).toBe('true');
    });

    it('has no axe violations', async () => {
      const { fixture, boxes } = await setup();
      boxes[1].click();
      await fixture.whenStable();
      await expectNoAxeViolations(fixture.nativeElement);
    });
  });

  describe('forms integration', () => {
    @Component({
      imports: [UiCheckbox, UiControlValueAccessor, ReactiveFormsModule, FormsModule, FormField],
      template: `
        <ui-checkbox [formControl]="terms">Accept terms</ui-checkbox>
        <ui-checkbox [(ngModel)]="news">Newsletter</ui-checkbox>
        <ui-checkbox [formField]="signup.terms">Accept terms (signal)</ui-checkbox>
      `,
    })
    class Host {
      readonly terms = new FormControl(false, { nonNullable: true, validators: Validators.requiredTrue });
      news = true;
      readonly model = signal({ terms: false });
      readonly signup = form(this.model, (p) => required(p.terms));
    }

    async function setup() {
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      return { fixture, host: fixture.componentInstance, boxes: inputs(fixture.nativeElement) };
    }

    it('works with a FormControl: value, touched, disabled and error state', async () => {
      const { fixture, host, boxes } = await setup();
      expect(boxes[0].getAttribute('aria-required')).toBe('true');
      expect(boxes[0].hasAttribute('aria-invalid')).toBe(false);
      boxes[0].dispatchEvent(new Event('blur'));
      await fixture.whenStable();
      expect(host.terms.touched).toBe(true);
      expect(boxes[0].getAttribute('aria-invalid')).toBe('true');
      boxes[0].click();
      await fixture.whenStable();
      expect(host.terms.value).toBe(true);
      expect(boxes[0].hasAttribute('aria-invalid')).toBe(false);
      host.terms.setValue(false);
      host.terms.disable();
      await fixture.whenStable();
      expect(boxes[0].checked).toBe(false);
      expect(boxes[0].disabled).toBe(true);
    });

    it('works with ngModel', async () => {
      const { fixture, host, boxes } = await setup();
      expect(boxes[1].checked).toBe(true);
      boxes[1].click();
      await fixture.whenStable();
      expect(host.news).toBe(false);
    });

    it('works with Signal Forms [formField] and a required validator', async () => {
      const { fixture, host, boxes } = await setup();
      expect(boxes[2].getAttribute('aria-required')).toBe('true');
      expect(boxes[2].hasAttribute('aria-invalid')).toBe(false); // not touched yet
      boxes[2].dispatchEvent(new Event('blur'));
      await fixture.whenStable();
      expect(host.signup.terms().touched()).toBe(true);
      expect(boxes[2].getAttribute('aria-invalid')).toBe('true');
      boxes[2].click();
      await fixture.whenStable();
      expect(host.model().terms).toBe(true);
      expect(boxes[2].hasAttribute('aria-invalid')).toBe(false);
      await expectNoAxeViolations(fixture.nativeElement);
    });
  });
});
