import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from '../test-utils';
import { UiAvatar, UiAvatarGroup, UiAvatarStatus } from './index';

@Component({
  imports: [UiAvatar, UiAvatarGroup],
  template: `
    <ui-avatar id="photo" name="Ada Lovelace" [src]="src()" [status]="status()" size="lg" />
    <ui-avatar id="initials" name="Grace Hopper" />
    <ui-avatar id="anonymous" />
    <p><ui-avatar id="decorative" name="Linus Torvalds" decorative /> Linus Torvalds</p>

    <ui-avatar-group aria-label="Assignees" [max]="max()" size="sm">
      @for (person of people; track person) {
        <ui-avatar [name]="person" />
      }
    </ui-avatar-group>
  `,
})
class Host {
  readonly src = signal<string | null>('https://example.com/ada.png');
  readonly status = signal<UiAvatarStatus | null>('online');
  readonly max = signal(3);
  readonly people = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Radia Perlman', 'Ken Thompson', 'Barbara Liskov'];
}

describe('UiAvatar', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const q = (selector: string) => el.querySelector(selector) as HTMLElement;
    return { fixture, host: fixture.componentInstance, el, q };
  }

  it('shows the image as one labelled img with the status in its name', async () => {
    const { q } = await setup();
    const photo = q('#photo');
    expect(photo.getAttribute('role')).toBe('img');
    expect(photo.getAttribute('aria-label')).toBe('Ada Lovelace, online');
    expect(photo.querySelector('img')?.getAttribute('alt')).toBe('');
    expect(photo.querySelector('.ui-avatar__status--online')?.getAttribute('aria-hidden')).toBe('true');
    expect(photo.classList).toContain('ui-avatar--lg');
  });

  it('falls back to initials when the image fails and retries on a new src', async () => {
    const { fixture, host, q } = await setup();
    const photo = q('#photo');
    photo.querySelector('img')!.dispatchEvent(new Event('error'));
    await fixture.whenStable();
    expect(photo.querySelector('img')).toBeNull();
    expect(photo.querySelector('.ui-avatar__initials')?.textContent).toBe('AL');

    host.src.set('https://example.com/ada-2.png');
    await fixture.whenStable();
    expect(photo.querySelector('img')?.getAttribute('src')).toBe('https://example.com/ada-2.png');
  });

  it('renders initials with a deterministic palette colour', async () => {
    const { q } = await setup();
    const initials = q('#initials');
    expect(initials.querySelector('.ui-avatar__initials')?.getAttribute('aria-hidden')).toBe('true');
    expect(initials.textContent?.trim()).toBe('GH');
    expect(initials.style.getPropertyValue('--_avatar-bg')).toMatch(/^var\(--ui-color-/);
    expect(initials.style.getPropertyValue('--_avatar-fg')).toMatch(/^var\(--ui-color-/);
    expect(initials.getAttribute('aria-label')).toBe('Grace Hopper');
  });

  it('uses a placeholder icon and a generic name without a name', async () => {
    const { q } = await setup();
    const anonymous = q('#anonymous');
    expect(anonymous.querySelector('.ui-avatar__placeholder')).not.toBeNull();
    expect(anonymous.getAttribute('aria-label')).toBe('Unknown user');
  });

  it('can be decorative', async () => {
    const { q } = await setup();
    const decorative = q('#decorative');
    expect(decorative.getAttribute('aria-hidden')).toBe('true');
    expect(decorative.hasAttribute('role')).toBe(false);
    expect(decorative.hasAttribute('aria-label')).toBe(false);
  });

  it('drops the status from the name when cleared', async () => {
    const { fixture, host, q } = await setup();
    host.status.set(null);
    await fixture.whenStable();
    expect(q('#photo').getAttribute('aria-label')).toBe('Ada Lovelace');
    expect(q('#photo').querySelector('.ui-avatar__status')).toBeNull();
  });
});

describe('UiAvatarGroup', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const group = (fixture.nativeElement as HTMLElement).querySelector('ui-avatar-group') as HTMLElement;
    const avatars = () => Array.from(group.querySelectorAll<HTMLElement>('ui-avatar'));
    const overflow = () => group.querySelector<HTMLElement>('.ui-avatar-group__overflow');
    return { fixture, host: fixture.componentInstance, group, avatars, overflow };
  }

  it('is a labelled group', async () => {
    const { group } = await setup();
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('Assignees');
  });

  it('shows at most max avatars and an announced overflow counter', async () => {
    const { avatars, overflow } = await setup();
    expect(avatars().map((a) => a.hidden)).toEqual([false, false, false, true, true, true]);
    expect(overflow()?.textContent?.trim()).toBe('+3');
    expect(overflow()?.getAttribute('role')).toBe('img');
    expect(overflow()?.getAttribute('aria-label')).toBe('3 more');
  });

  it('passes its size to the avatars', async () => {
    const { avatars } = await setup();
    expect(avatars()[0].classList).toContain('ui-avatar--sm');
  });

  it('removes the counter when everything fits', async () => {
    const { fixture, host, avatars, overflow } = await setup();
    host.max.set(10);
    await fixture.whenStable();
    expect(avatars().every((a) => !a.hidden)).toBe(true);
    expect(overflow()).toBeNull();
  });

  it('has no axe violations', async () => {
    const { fixture } = await setup();
    await expectNoAxeViolations(fixture.nativeElement);
  });
});
