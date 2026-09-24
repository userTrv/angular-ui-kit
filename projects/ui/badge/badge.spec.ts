import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations, press } from '../test-utils';
import { UiBadge, UiBadgeAppearance, UiBadgeVariant, UiTag } from './index';

@Component({
  imports: [UiBadge, UiTag],
  template: `
    <ui-badge [variant]="variant()" [appearance]="appearance()" dot>Paid</ui-badge>
    <ui-badge size="sm">Beta</ui-badge>

    @for (tag of tags(); track tag) {
      <ui-tag removable [disabled]="tag === 'Locked'" (removed)="remove(tag)">{{ tag }}</ui-tag>
    }
    <ui-tag variant="info">Read-only</ui-tag>
  `,
})
class Host {
  readonly variant = signal<UiBadgeVariant>('success');
  readonly appearance = signal<UiBadgeAppearance>('subtle');
  readonly tags = signal(['Angular', 'TypeScript', 'Locked']);
  remove(tag: string) {
    this.tags.update((tags) => tags.filter((t) => t !== tag));
  }
}

describe('UiBadge', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, host: fixture.componentInstance, el };
  }

  it('applies variant, appearance and size classes', async () => {
    const { fixture, host, el } = await setup();
    const [paid, beta] = Array.from(el.querySelectorAll('ui-badge'));
    for (const cls of ['ui-badge', 'ui-badge--success', 'ui-badge--subtle', 'ui-badge--md']) {
      expect(paid.classList).toContain(cls);
    }
    expect(beta.classList).toContain('ui-badge--sm');
    expect(beta.classList).toContain('ui-badge--neutral');
    host.variant.set('danger');
    host.appearance.set('solid');
    await fixture.whenStable();
    expect(paid.classList).toContain('ui-badge--danger');
    expect(paid.classList).toContain('ui-badge--solid');
    expect(paid.classList).not.toContain('ui-badge--success');
  });

  it('renders a decorative dot next to the text', async () => {
    const { el } = await setup();
    const paid = el.querySelector('ui-badge')!;
    expect(paid.querySelector('.ui-badge__dot')?.getAttribute('aria-hidden')).toBe('true');
    expect(paid.textContent?.trim()).toBe('Paid');
  });
});

describe('UiTag', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const removeButton = (text: string) =>
      Array.from(el.querySelectorAll('ui-tag'))
        .find((t) => t.textContent?.includes(text))
        ?.querySelector('button') as HTMLButtonElement;
    return { fixture, host: fixture.componentInstance, el, removeButton };
  }

  const accessibleName = (button: HTMLButtonElement) =>
    (button.getAttribute('aria-labelledby') ?? '')
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent?.trim())
      .join(' ');

  it('names the remove button "Remove <label>"', async () => {
    const { removeButton } = await setup();
    expect(accessibleName(removeButton('Angular'))).toBe('Remove Angular');
  });

  it('only renders a remove button when removable', async () => {
    const { el } = await setup();
    const readOnly = Array.from(el.querySelectorAll('ui-tag')).find((t) => t.textContent?.includes('Read-only'))!;
    expect(readOnly.querySelector('button')).toBeNull();
    expect(readOnly.classList).toContain('ui-tag--info');
  });

  it('emits removed on click', async () => {
    const { fixture, host, removeButton } = await setup();
    removeButton('Angular').click();
    await fixture.whenStable();
    expect(host.tags()).toEqual(['TypeScript', 'Locked']);
  });

  it('removes the focused tag with Backspace or Delete', async () => {
    const { fixture, host, removeButton } = await setup();
    const button = removeButton('TypeScript');
    button.focus();
    const event = press(button, 'Backspace');
    await fixture.whenStable();
    expect(event.defaultPrevented).toBe(true);
    expect(host.tags()).toEqual(['Angular', 'Locked']);

    press(removeButton('Angular'), 'Delete');
    await fixture.whenStable();
    expect(host.tags()).toEqual(['Locked']);
  });

  it('does not remove disabled tags', async () => {
    const { fixture, host, removeButton } = await setup();
    const button = removeButton('Locked');
    expect(button.disabled).toBe(true);
    press(button, 'Delete');
    await fixture.whenStable();
    expect(host.tags()).toContain('Locked');
  });

  it('has no axe violations', async () => {
    const { fixture } = await setup();
    await expectNoAxeViolations(fixture.nativeElement);
  });
});
