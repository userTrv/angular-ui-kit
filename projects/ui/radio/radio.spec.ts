import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { UiControlValueAccessor } from '@usertrv/ui/forms';
import { expectNoAxeViolations, press } from '../test-utils';
import { UiRadioButton, UiRadioGroup } from './index';

type Plan = 'free' | 'pro' | 'team';

function radios(root: Element): HTMLInputElement[] {
  return Array.from(root.querySelectorAll('input[type=radio]'));
}

describe('UiRadioGroup', () => {
  describe('standalone', () => {
    @Component({
      imports: [UiRadioGroup, UiRadioButton],
      template: `
        <ui-radio-group label="Plan" [(value)]="plan" orientation="horizontal" (touch)="touched = true">
          <ui-radio-button value="free">Free</ui-radio-button>
          <ui-radio-button value="pro">Pro</ui-radio-button>
          <ui-radio-button value="team" disabled>Team</ui-radio-button>
        </ui-radio-group>
        <button type="button">After</button>
        <ui-radio-group aria-label="Shipping" [disabled]="true">
          <ui-radio-button value="standard">Standard</ui-radio-button>
        </ui-radio-group>
      `,
    })
    class Host {
      readonly plan = signal<Plan | null>('pro');
      touched = false;
    }

    async function setup() {
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      const el = fixture.nativeElement as HTMLElement;
      const [group, other] = Array.from(el.querySelectorAll('ui-radio-group'));
      return { fixture, host: fixture.componentInstance, el, group, other, items: radios(group) };
    }

    it('is a labelled radiogroup of native radios sharing one name', async () => {
      const { group, items } = await setup();
      expect(group.getAttribute('role')).toBe('radiogroup');
      const labelId = group.getAttribute('aria-labelledby') as string;
      expect(document.getElementById(labelId)?.textContent).toBe('Plan');
      expect(new Set(items.map((r) => r.name)).size).toBe(1);
      expect(items[0].name).toMatch(/^ui-radio-group-/);
      expect(items.map((r) => r.value)).toEqual(['free', 'pro', 'team']);
      expect(items[0].closest('label')?.textContent?.trim()).toBe('Free');
    });

    it('checks the radio matching the value, so Tab enters the group there', async () => {
      const { items } = await setup();
      expect(items.map((r) => r.checked)).toEqual([false, true, false]);
    });

    it('selects on click / change', async () => {
      const { fixture, host, items, group } = await setup();
      items[0].click();
      await fixture.whenStable();
      expect(host.plan()).toBe('free');
      expect(items[1].checked).toBe(false);
      expect(group.querySelector('ui-radio-button')?.classList).toContain('ui-radio--checked');
    });

    it('leaves arrow keys to the browser and natively disables options', async () => {
      const { items } = await setup();
      items[1].focus();
      // Browsers move focus and selection between same-name radios on arrows; the kit must not interfere.
      expect(press(items[1], 'ArrowRight').defaultPrevented).toBe(false);
      expect(press(items[1], 'ArrowUp').defaultPrevented).toBe(false);
      // Disabled radios are skipped by the browser's arrow-key navigation.
      expect(items[2].disabled).toBe(true);
    });

    it('updates the checked radio when the value changes programmatically', async () => {
      const { fixture, host, items } = await setup();
      host.plan.set(null);
      await fixture.whenStable();
      expect(items.some((r) => r.checked)).toBe(false);
      host.plan.set('free');
      await fixture.whenStable();
      expect(items[0].checked).toBe(true);
    });

    it('emits touch only when focus leaves the whole group', async () => {
      const { host, items, el } = await setup();
      items[0].dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: items[1] }));
      expect(host.touched).toBe(false);
      items[1].dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: el.querySelector('button') }));
      expect(host.touched).toBe(true);
    });

    it('disables every option and sets aria-disabled on a disabled group', async () => {
      const { other } = await setup();
      expect(other.getAttribute('aria-disabled')).toBe('true');
      expect(other.getAttribute('aria-label')).toBe('Shipping');
      expect(radios(other).every((r) => r.disabled)).toBe(true);
    });

    it('focus() goes to the checked option', async () => {
      const { fixture, items } = await setup();
      const group = fixture.debugElement.query((d) => d.name === 'ui-radio-group').componentInstance as UiRadioGroup;
      group.focus();
      expect(document.activeElement).toBe(items[1]);
    });

    it('has no axe violations', async () => {
      const { el } = await setup();
      await expectNoAxeViolations(el);
    });
  });

  describe('forms integration', () => {
    @Component({
      imports: [UiRadioGroup, UiRadioButton, UiControlValueAccessor, ReactiveFormsModule, FormsModule, FormField],
      template: `
        <ui-radio-group label="Reactive" [formControl]="ctrl">
          <ui-radio-button value="free">Free</ui-radio-button>
          <ui-radio-button value="pro">Pro</ui-radio-button>
        </ui-radio-group>
        <ui-radio-group label="Template" [(ngModel)]="size">
          <ui-radio-button [value]="1">Small</ui-radio-button>
          <ui-radio-button [value]="2">Large</ui-radio-button>
        </ui-radio-group>
        <ui-radio-group label="Signal" [formField]="order.plan">
          <ui-radio-button value="free">Free</ui-radio-button>
          <ui-radio-button value="pro">Pro</ui-radio-button>
        </ui-radio-group>
      `,
    })
    class Host {
      readonly ctrl = new FormControl<Plan | null>('free');
      size = 2;
      readonly model = signal<{ plan: Plan | null }>({ plan: null });
      readonly order = form(this.model, (p) => required(p.plan));
    }

    async function setup() {
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
      const groups = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('ui-radio-group'));
      return { fixture, host: fixture.componentInstance, groups };
    }

    it('works with a FormControl', async () => {
      const { fixture, host, groups } = await setup();
      const items = radios(groups[0]);
      expect(items[0].checked).toBe(true);
      items[1].click();
      items[1].dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      await fixture.whenStable();
      expect(host.ctrl.value).toBe('pro');
      expect(host.ctrl.touched).toBe(true);
      host.ctrl.disable();
      await fixture.whenStable();
      expect(items.every((r) => r.disabled)).toBe(true);
    });

    it('works with ngModel and non-string values', async () => {
      const { fixture, host, groups } = await setup();
      const items = radios(groups[1]);
      expect(items[1].checked).toBe(true);
      items[0].click();
      await fixture.whenStable();
      expect(host.size).toBe(1);
    });

    it('works with Signal Forms: name, required and error after touch', async () => {
      const { fixture, host, groups } = await setup();
      const group = groups[2];
      const items = radios(group);
      expect(group.getAttribute('aria-required')).toBe('true');
      expect(items[0].name).toBe(host.order.plan().name());
      expect(group.hasAttribute('aria-invalid')).toBe(false);
      items[0].dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      await fixture.whenStable();
      expect(group.getAttribute('aria-invalid')).toBe('true');
      items[1].click();
      await fixture.whenStable();
      expect(host.model().plan).toBe('pro');
      expect(group.hasAttribute('aria-invalid')).toBe(false);
      await expectNoAxeViolations(fixture.nativeElement);
    });
  });
});
