import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { UiControlValueAccessor } from '@usertrv/ui/forms';
import { expectNoAxeViolations, press } from '../test-utils';
import { UiSwitch } from './index';

function switches(root: HTMLElement): HTMLInputElement[] {
  return Array.from(root.querySelectorAll('input[role=switch]'));
}

describe('UiSwitch', () => {
  @Component({
    imports: [UiSwitch, UiControlValueAccessor, ReactiveFormsModule, FormsModule, FormField],
    template: `
      <ui-switch [(checked)]="wifi" description="Joins known networks automatically">Wi-Fi</ui-switch>
      <ui-switch disabled labelPosition="before">Bluetooth</ui-switch>
      <ui-switch [formControl]="dark">Dark mode</ui-switch>
      <ui-switch [(ngModel)]="sounds">Sounds</ui-switch>
      <ui-switch [formField]="consent.analytics">Share analytics</ui-switch>
    `,
  })
  class Host {
    readonly wifi = signal(true);
    readonly dark = new FormControl(false, { nonNullable: true });
    sounds = false;
    readonly model = signal({ analytics: false });
    readonly consent = form(this.model, (p) => required(p.analytics));
  }

  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return { fixture, host: fixture.componentInstance, els: switches(fixture.nativeElement) };
  }

  it('is a native checkbox with role="switch", named by its label', async () => {
    const { els } = await setup();
    expect(els).toHaveLength(5);
    expect(els[0].type).toBe('checkbox');
    expect(els[0].checked).toBe(true);
    expect(els[0].closest('label')?.textContent?.trim()).toBe('Wi-Fi');
  });

  it('links the description with aria-describedby, outside the accessible name', async () => {
    const { fixture, els } = await setup();
    const description = fixture.nativeElement.querySelector('.ui-switch__description') as HTMLElement;
    expect(els[0].getAttribute('aria-describedby')).toBe(description.id);
    expect(description.closest('label')).toBeNull();
  });

  it('toggles on click and two-way binds checked', async () => {
    const { fixture, host, els } = await setup();
    els[0].click();
    await fixture.whenStable();
    expect(host.wifi()).toBe(false);
    expect(fixture.nativeElement.querySelector('ui-switch').classList).not.toContain('ui-switch--checked');
  });

  it('is focusable and leaves Space to the browser (keyboard)', async () => {
    const { els } = await setup();
    els[0].focus();
    expect(document.activeElement).toBe(els[0]);
    expect(press(els[0], ' ').defaultPrevented).toBe(false);
  });

  it('disables the native input', async () => {
    const { fixture, els } = await setup();
    expect(els[1].disabled).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('ui-switch')[1].classList).toContain('ui-switch--label-before');
  });

  it('works with a FormControl', async () => {
    const { fixture, host, els } = await setup();
    els[2].click();
    els[2].dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(host.dark.value).toBe(true);
    expect(host.dark.touched).toBe(true);
    host.dark.disable();
    await fixture.whenStable();
    expect(els[2].disabled).toBe(true);
  });

  it('works with ngModel', async () => {
    const { fixture, host, els } = await setup();
    els[3].click();
    await fixture.whenStable();
    expect(host.sounds).toBe(true);
  });

  it('works with Signal Forms and shows the required error after touch', async () => {
    const { fixture, host, els } = await setup();
    expect(els[4].getAttribute('aria-required')).toBe('true');
    expect(els[4].hasAttribute('aria-invalid')).toBe(false);
    els[4].dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(els[4].getAttribute('aria-invalid')).toBe('true');
    els[4].click();
    await fixture.whenStable();
    expect(host.model().analytics).toBe(true);
    expect(els[4].hasAttribute('aria-invalid')).toBe(false);
  });

  it('has no axe violations', async () => {
    const { fixture } = await setup();
    await expectNoAxeViolations(fixture.nativeElement);
  });
});
