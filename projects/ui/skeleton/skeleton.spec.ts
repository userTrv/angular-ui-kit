import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from '../test-utils';
import { UiBusy, UiSkeleton } from './index';

@Component({
  imports: [UiSkeleton, UiBusy],
  template: `
    <section aria-label="Team" [uiBusy]="loading()">
      @if (loading()) {
        <span class="ui-sr-only">Loading team…</span>
        <ui-skeleton shape="circle" width="3rem" />
        <ui-skeleton [lines]="3" width="16rem" />
        <ui-skeleton shape="rect" height="8rem" [animated]="false" />
      } @else {
        <p>Ada Lovelace</p>
      }
    </section>
  `,
})
class Host {
  readonly loading = signal(true);
}

describe('UiSkeleton', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const skeletons = () => Array.from(el.querySelectorAll<HTMLElement>('ui-skeleton'));
    return { fixture, host: fixture.componentInstance, el, skeletons };
  }

  it('hides every placeholder from assistive tech', async () => {
    const { skeletons } = await setup();
    expect(skeletons().length).toBe(3);
    for (const s of skeletons()) expect(s.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders shapes, sizes and line counts', async () => {
    const { skeletons } = await setup();
    const [circle, text, rect] = skeletons();
    expect(circle.classList).toContain('ui-skeleton--circle');
    expect(circle.style.width).toBe('3rem');
    expect(text.querySelectorAll('.ui-skeleton__line').length).toBe(3);
    expect(text.style.width).toBe('16rem');
    expect(text.style.height).toBe('');
    expect(rect.classList).toContain('ui-skeleton--rect');
    expect(rect.style.height).toBe('8rem');
  });

  it('can switch the shimmer off', async () => {
    const { skeletons } = await setup();
    expect(skeletons()[2].classList).toContain('ui-skeleton--static');
    expect(skeletons()[0].classList).not.toContain('ui-skeleton--static');
  });

  it('marks the region busy only while loading', async () => {
    const { fixture, host, el } = await setup();
    const region = el.querySelector('section')!;
    expect(region.getAttribute('aria-busy')).toBe('true');
    host.loading.set(false);
    await fixture.whenStable();
    expect(region.hasAttribute('aria-busy')).toBe(false);
    expect(el.querySelector('ui-skeleton')).toBeNull();
  });

  it('has no axe violations', async () => {
    const { fixture } = await setup();
    await expectNoAxeViolations(fixture.nativeElement);
  });
});
