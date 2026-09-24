import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from '../test-utils';
import { UiPagination } from './index';

@Component({
  imports: [UiPagination],
  template: `
    <ui-pagination
      aria-label="Orders pages"
      [length]="length()"
      [(page)]="page"
      [(pageSize)]="pageSize"
      [compact]="compact()"
    />
  `,
})
class Host {
  readonly length = signal(1234);
  readonly page = signal(2);
  readonly pageSize = signal(20);
  readonly compact = signal(false);
}

describe('UiPagination', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const q = <T extends Element>(selector: string) => el.querySelector(selector) as T;
    const pages = () => Array.from(el.querySelectorAll<HTMLButtonElement>('.ui-pagination__page'));
    return {
      fixture,
      host: fixture.componentInstance,
      el,
      nav: q<HTMLElement>('nav'),
      prev: q<HTMLButtonElement>('[aria-label="Previous page"]'),
      next: q<HTMLButtonElement>('[aria-label="Next page"]'),
      summary: q<HTMLElement>('.ui-pagination__summary'),
      select: q<HTMLSelectElement>('select'),
      pages,
    };
  }

  it('is a labelled navigation landmark', async () => {
    const { nav, el } = await setup();
    expect(nav.getAttribute('aria-label')).toBe('Orders pages');
    expect(el.querySelector('ui-pagination')?.hasAttribute('aria-label')).toBe(false);
  });

  it('marks the current page with aria-current and renders ellipses', async () => {
    const { pages, el } = await setup();
    expect(pages().map((b) => b.textContent?.trim())).toEqual(['1', '2', '3', '4', '5', '62']);
    const current = pages().filter((b) => b.getAttribute('aria-current') === 'page');
    expect(current.map((b) => b.getAttribute('aria-label'))).toEqual(['Page 2']);
    const ellipses = el.querySelectorAll('.ui-pagination__ellipsis');
    expect(ellipses.length).toBe(1);
    expect(ellipses[0].getAttribute('aria-hidden')).toBe('true');
  });

  it('summarises the visible range with localized numbers', async () => {
    const { summary } = await setup();
    expect(summary.textContent?.trim()).toBe('Showing 21–40 of 1,234');
    expect(summary.getAttribute('aria-live')).toBe('polite');
  });

  it('navigates with page, previous and next buttons', async () => {
    const { fixture, host, pages, prev, next } = await setup();
    pages().find((b) => b.textContent?.trim() === '62')!.click();
    await fixture.whenStable();
    expect(host.page()).toBe(62);
    expect(next.getAttribute('aria-disabled')).toBe('true');
    next.click();
    await fixture.whenStable();
    expect(host.page()).toBe(62);

    prev.click();
    await fixture.whenStable();
    expect(host.page()).toBe(61);
  });

  it('keeps previous focusable but inert on the first page', async () => {
    const { fixture, host, prev } = await setup();
    prev.focus();
    prev.click();
    await fixture.whenStable();
    expect(host.page()).toBe(1);
    expect(prev.getAttribute('aria-disabled')).toBe('true');
    expect(prev.disabled).toBe(false);
    expect(document.activeElement).toBe(prev);
    prev.click();
    await fixture.whenStable();
    expect(host.page()).toBe(1);
  });

  it('changes the page size and keeps the first visible item on screen', async () => {
    const { fixture, host, select, summary } = await setup();
    host.page.set(5); // items 81–100
    await fixture.whenStable();
    expect(select.value).toBe('20');
    select.value = '50';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(host.pageSize()).toBe(50);
    expect(host.page()).toBe(2); // items 51–100 contain item 81
    expect(summary.textContent?.trim()).toBe('Showing 51–100 of 1,234');
  });

  it('clamps the page when the length shrinks', async () => {
    const { fixture, host, summary } = await setup();
    host.page.set(62);
    host.length.set(30);
    await fixture.whenStable();
    expect(summary.textContent?.trim()).toBe('Showing 21–30 of 30');
  });

  it('shows "No results" for an empty list', async () => {
    const { fixture, host, summary, next } = await setup();
    host.length.set(0);
    await fixture.whenStable();
    expect(summary.textContent?.trim()).toBe('No results');
    expect(next.getAttribute('aria-disabled')).toBe('true');
  });

  it('switches to the compact layout', async () => {
    const { fixture, host, el } = await setup();
    host.compact.set(true);
    await fixture.whenStable();
    expect(el.querySelector('ui-pagination')?.classList).toContain('ui-pagination--compact');
    expect(el.querySelector('.ui-pagination__compact-status')?.textContent?.trim()).toBe('Page 2 of 62');
  });

  it('has no axe violations', async () => {
    const { fixture } = await setup();
    await expectNoAxeViolations(fixture.nativeElement);
  });
});
