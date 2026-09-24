import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from '../test-utils';
import { UiButton, UiButtonVariant } from './index';

@Component({
  imports: [UiButton],
  template: `
    <button uiButton [variant]="variant()" [loading]="loading()" [disabled]="disabled()" (click)="clicks = clicks + 1">
      Save
    </button>
    <a uiButton href="#" [disabled]="disabled()">Link</a>
    <button uiIconButton aria-label="Close">x</button>
  `,
})
class Host {
  readonly variant = signal<UiButtonVariant>('primary');
  readonly loading = signal(false);
  readonly disabled = signal(false);
  clicks = 0;
}

describe('UiButton', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      button: el.querySelector('button[uiButton]') as HTMLButtonElement,
      link: el.querySelector('a[uiButton]') as HTMLAnchorElement,
      icon: el.querySelector('button[uiIconButton]') as HTMLButtonElement,
    };
  }

  it('applies variant and size classes', async () => {
    const { fixture, host, button } = await setup();
    expect(button.classList).toContain('ui-button--primary');
    expect(button.classList).toContain('ui-button--md');
    host.variant.set('danger');
    await fixture.whenStable();
    expect(button.classList).toContain('ui-button--danger');
    expect(button.classList).not.toContain('ui-button--primary');
  });

  it('keeps the button focusable but inert while loading', async () => {
    const { fixture, host, button } = await setup();
    host.loading.set(true);
    await fixture.whenStable();
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.disabled).toBe(false);
    expect(button.querySelector('.ui-button__spinner')).not.toBeNull();
    button.click();
    expect(host.clicks).toBe(0);
  });

  it('uses the native disabled attribute on <button>', async () => {
    const { fixture, host, button } = await setup();
    host.disabled.set(true);
    await fixture.whenStable();
    expect(button.disabled).toBe(true);
    expect(button.hasAttribute('aria-disabled')).toBe(false);
  });

  it('disables links with aria-disabled and removes them from the tab order', async () => {
    const { fixture, host, link } = await setup();
    host.disabled.set(true);
    await fixture.whenStable();
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.getAttribute('tabindex')).toBe('-1');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('renders icon buttons square', async () => {
    const { icon } = await setup();
    expect(icon.classList).toContain('ui-button--icon');
  });

  it('warns in dev mode when an icon button has no accessible name', async () => {
    @Component({ imports: [UiButton], template: `<button uiIconButton>x</button>` })
    class Unlabelled {}
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(Unlabelled);
    await fixture.whenStable();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('accessible name'), expect.anything());
    warn.mockRestore();
  });

  it('has no axe violations', async () => {
    const { fixture } = await setup();
    await expectNoAxeViolations(fixture.nativeElement);
  });
});
