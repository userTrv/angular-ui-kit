import { Dir } from '@angular/cdk/bidi';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations, press } from '../test-utils';
import { UiCalendar, UiCalendarSelectionMode, UiDateFilter, UiDateRange } from './index';

@Component({
  imports: [UiCalendar],
  template: `
    <ui-calendar
      [selectionMode]="mode()"
      [(value)]="value"
      [(range)]="range"
      [min]="min()"
      [max]="max()"
      [dateFilter]="filter()"
      [locale]="locale()"
      [startAt]="startAt()"
      (dateSelected)="picked.push($event)"
      (rangeSelected)="ranges.push($event)"
    />
  `,
})
class Host {
  readonly mode = signal<UiCalendarSelectionMode>('single');
  readonly value = signal<Date | null>(null);
  readonly range = signal<UiDateRange>({ start: null, end: null });
  readonly min = signal<Date | null>(null);
  readonly max = signal<Date | null>(null);
  readonly filter = signal<UiDateFilter | null>(null);
  readonly locale = signal('en-US');
  readonly startAt = signal<Date | null>(new Date(2026, 8, 24));
  readonly picked: Date[] = [];
  readonly ranges: UiDateRange[] = [];
}

describe('UiCalendar', () => {
  async function setup(init: (host: Host) => void = () => undefined) {
    const fixture = TestBed.createComponent(Host);
    init(fixture.componentInstance);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const grid = () => el.querySelector('[role=grid]') as HTMLElement;
    const active = () => el.querySelector('td[tabindex="0"]') as HTMLElement;
    const title = () => el.querySelector('.ui-calendar__title') as HTMLElement;
    const cell = (label: string) => el.querySelector(`td[aria-label="${label}"]`) as HTMLElement;
    const key = async (k: string, init: KeyboardEventInit = {}) => {
      press(active(), k, init);
      await fixture.whenStable();
    };
    return { fixture, host: fixture.componentInstance, el, grid, active, title, cell, key };
  }

  describe('ARIA grid structure', () => {
    it('renders a labelled grid with weekday column headers and date cells', async () => {
      const { el, grid, title } = await setup();
      expect(grid().tagName).toBe('TABLE');
      expect(title().textContent?.trim()).toBe('September 2026');
      expect(title().getAttribute('aria-live')).toBe('polite');
      expect(grid().getAttribute('aria-labelledby')).toBe(title().id);
      const headers = Array.from(el.querySelectorAll('[role=columnheader]'));
      expect(headers.length).toBe(7);
      expect(headers[0].querySelector('.ui-sr-only')?.textContent).toBe('Sunday');
      expect(headers[0].querySelector('[aria-hidden=true]')?.textContent).toBe('Sun');
      const cells = el.querySelectorAll('td[role=gridcell][aria-label]');
      expect(cells.length).toBe(30);
      expect(el.querySelectorAll('tr[role=row]').length).toBe(6); // header + 5 weeks
    });

    it('has exactly one tab stop, on the active date', async () => {
      const { el, active } = await setup();
      expect(el.querySelectorAll('td[tabindex="0"]').length).toBe(1);
      expect(active().getAttribute('aria-label')).toBe('Thursday, September 24, 2026');
    });

    it('marks selection, today and disabled days', async () => {
      const { fixture, host, el, cell } = await setup((h) => {
        h.value.set(new Date(2026, 8, 10));
        h.startAt.set(null);
        h.filter.set((d) => d.getDay() !== 0 && d.getDay() !== 6);
      });
      expect(cell('Thursday, September 10, 2026').getAttribute('aria-selected')).toBe('true');
      expect(cell('Friday, September 11, 2026').getAttribute('aria-selected')).toBe('false');
      expect(cell('Saturday, September 12, 2026').getAttribute('aria-disabled')).toBe('true');
      expect(cell('Friday, September 11, 2026').hasAttribute('aria-disabled')).toBe(false);

      host.value.set(null);
      await fixture.whenStable();
      const current = el.querySelectorAll('[aria-current=date]');
      expect(current.length).toBe(1);
      const now = new Date();
      expect(current[0].getAttribute('aria-label')).toBe(
        new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(now),
      );
    });

    it('labels the navigation buttons', async () => {
      const { el } = await setup();
      const labels = Array.from(el.querySelectorAll('.ui-calendar__nav')).map((b) => b.getAttribute('aria-label'));
      expect(labels).toEqual(['Previous year', 'Previous month', 'Next month', 'Next year']);
    });
  });

  describe('locale', () => {
    it('uses German names and a Monday week start for de-DE', async () => {
      const { el, title, active } = await setup((h) => h.locale.set('de-DE'));
      expect(title().textContent?.trim()).toBe('September 2026');
      const headers = Array.from(el.querySelectorAll('[role=columnheader] .ui-sr-only')).map((h) => h.textContent);
      expect(headers[0]).toBe('Montag');
      expect(headers[6]).toBe('Sonntag');
      expect(active().getAttribute('aria-label')).toBe('Donnerstag, 24. September 2026');
      // September 1st 2026 is a Tuesday: one blank cell before it in a Monday-first week.
      const firstRow = el.querySelectorAll('tbody tr')[0].querySelectorAll('td');
      expect(firstRow[0].hasAttribute('aria-label')).toBe(false);
      expect(firstRow[1].textContent?.trim()).toBe('1');
    });

    it('starts weeks on Sunday for en-US and honours an explicit firstDayOfWeek', async () => {
      const { el } = await setup();
      expect(el.querySelector('[role=columnheader] .ui-sr-only')?.textContent).toBe('Sunday');
      // Sep 1 2026 is a Tuesday: two blanks with Sunday-first weeks.
      const firstRow = el.querySelectorAll('tbody tr')[0].querySelectorAll('td');
      expect(firstRow[2].textContent?.trim()).toBe('1');

      @Component({
        imports: [UiCalendar],
        template: `<ui-calendar locale="en-US" [firstDayOfWeek]="1" [startAt]="start" />`,
      })
      class Explicit {
        readonly start = new Date(2026, 8, 24);
      }
      const fixture = TestBed.createComponent(Explicit);
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('[role=columnheader] .ui-sr-only').textContent).toBe('Monday');
    });

    it('updates the month heading when the month changes (ja-JP)', async () => {
      const { title, key } = await setup((h) => h.locale.set('ja-JP'));
      expect(title().textContent?.trim()).toBe('2026年9月');
      await key('PageDown');
      expect(title().textContent?.trim()).toBe('2026年10月');
    });
  });

  describe('keyboard', () => {
    it('moves by day and week with the arrow keys and keeps focus on the active cell', async () => {
      const { active, key } = await setup();
      active().focus();
      await key('ArrowRight');
      expect(active().getAttribute('aria-label')).toBe('Friday, September 25, 2026');
      expect(document.activeElement).toBe(active());
      await key('ArrowDown');
      expect(active().getAttribute('aria-label')).toBe('Friday, October 2, 2026');
      await key('ArrowUp');
      await key('ArrowLeft');
      expect(active().getAttribute('aria-label')).toBe('Thursday, September 24, 2026');
      expect(document.activeElement).toBe(active());
    });

    it('crosses month and year boundaries', async () => {
      const { title, active, key } = await setup((h) => h.startAt.set(new Date(2026, 11, 31)));
      active().focus();
      await key('ArrowRight');
      expect(title().textContent?.trim()).toBe('January 2027');
      expect(active().getAttribute('aria-label')).toBe('Friday, January 1, 2027');
      expect(document.activeElement).toBe(active());
      await key('ArrowLeft');
      expect(title().textContent?.trim()).toBe('December 2026');
    });

    it('supports Home/End and PageUp/PageDown with and without Shift', async () => {
      const { title, active, key } = await setup((h) => h.startAt.set(new Date(2026, 0, 31)));
      active().focus();
      await key('Home');
      expect(active().getAttribute('aria-label')).toBe('Sunday, January 25, 2026');
      await key('End');
      expect(active().getAttribute('aria-label')).toBe('Saturday, January 31, 2026');
      await key('PageDown');
      expect(active().getAttribute('aria-label')).toBe('Saturday, February 28, 2026');
      await key('PageUp', { shiftKey: true });
      expect(title().textContent?.trim()).toBe('February 2025');
      await key('PageDown', { shiftKey: true });
      await key('PageUp');
      expect(title().textContent?.trim()).toBe('January 2026');
    });

    it('clamps navigation to min and max', async () => {
      const { title, active, key, el } = await setup((h) => {
        h.min.set(new Date(2026, 8, 22));
        h.max.set(new Date(2026, 9, 5));
      });
      active().focus();
      await key('ArrowUp');
      expect(active().getAttribute('aria-label')).toBe('Tuesday, September 22, 2026');
      await key('PageUp');
      expect(title().textContent?.trim()).toBe('September 2026');
      await key('PageDown', { shiftKey: true });
      expect(active().getAttribute('aria-label')).toBe('Monday, October 5, 2026');
      expect(document.activeElement).toBe(active());
      const nav = Array.from(el.querySelectorAll('.ui-calendar__nav')).map((b) => b.getAttribute('aria-disabled'));
      expect(nav).toEqual(['true', null, 'true', 'true']);
      expect(el.querySelector('td[aria-label="Friday, October 9, 2026"]')?.getAttribute('aria-disabled')).toBe('true');
    });

    it('selects with Enter and Space, but not disabled days', async () => {
      const { host, active, key } = await setup((h) => h.filter.set((d) => d.getDay() !== 5));
      active().focus();
      await key('Enter');
      expect(host.value()?.getDate()).toBe(24);
      expect(active().getAttribute('aria-selected')).toBe('true');
      await key('ArrowRight'); // Friday: filtered out, still focusable
      expect(active().getAttribute('aria-disabled')).toBe('true');
      await key(' ');
      expect(host.value()?.getDate()).toBe(24);
      await key('ArrowRight');
      await key(' ');
      expect(host.value()?.getDate()).toBe(26);
      expect(host.picked.map((d) => d.getDate())).toEqual([24, 26]);
    });

    it('mirrors ArrowLeft/ArrowRight in right-to-left layouts', async () => {
      @Component({
        imports: [UiCalendar, Dir],
        template: `<div dir="rtl"><ui-calendar locale="ar-EG" [startAt]="start" /></div>`,
      })
      class Rtl {
        readonly start = new Date(2026, 8, 24);
      }
      const fixture = TestBed.createComponent(Rtl);
      await fixture.whenStable();
      const el = fixture.nativeElement as HTMLElement;
      const active = () => el.querySelector('td[tabindex="0"]') as HTMLElement;
      // Arabic (Egypt) weeks start on Saturday, with Arabic-Indic digits.
      expect(el.querySelector('[role=columnheader] .ui-sr-only')?.textContent).toBe('السبت');
      expect(active().textContent?.trim()).toBe('٢٤');
      press(active(), 'ArrowLeft');
      await fixture.whenStable();
      expect(active().textContent?.trim()).toBe('٢٥');
    });
  });

  describe('mouse', () => {
    it('selects on click and navigates with the header buttons', async () => {
      const { fixture, host, el, cell, title } = await setup();
      cell('Tuesday, September 15, 2026').click();
      await fixture.whenStable();
      expect(host.value()?.getDate()).toBe(15);
      (el.querySelector('[aria-label="Next month"]') as HTMLButtonElement).click();
      await fixture.whenStable();
      expect(title().textContent?.trim()).toBe('October 2026');
      (el.querySelector('[aria-label="Previous year"]') as HTMLButtonElement).click();
      await fixture.whenStable();
      expect(title().textContent?.trim()).toBe('October 2025');
    });
  });

  describe('range mode', () => {
    it('selects a start and an end, with a preview in between', async () => {
      const { fixture, host, el, cell, grid } = await setup((h) => h.mode.set('range'));
      expect(grid().getAttribute('aria-multiselectable')).toBe('true');
      cell('Monday, September 14, 2026').click();
      await fixture.whenStable();
      expect(host.range()).toEqual({ start: new Date(2026, 8, 14), end: null });

      cell('Thursday, September 17, 2026').dispatchEvent(new MouseEvent('mouseenter'));
      await fixture.whenStable();
      expect(el.querySelectorAll('.ui-calendar__cell--preview').length).toBe(4);

      cell('Thursday, September 17, 2026').click();
      await fixture.whenStable();
      expect(host.ranges).toEqual([{ start: new Date(2026, 8, 14), end: new Date(2026, 8, 17) }]);
      const selected = Array.from(el.querySelectorAll('td[aria-selected=true]')).map((c) => c.textContent?.trim());
      expect(selected).toEqual(['14', '15', '16', '17']);
    });

    it('previews the range while moving with the keyboard and restarts on an earlier date', async () => {
      const { host, el, active, key } = await setup((h) => h.mode.set('range'));
      active().focus();
      await key('Enter');
      await key('ArrowRight');
      expect(el.querySelectorAll('.ui-calendar__cell--preview').length).toBe(2);
      await key('ArrowUp');
      await key('ArrowUp');
      await key('Enter');
      expect(host.range()).toEqual({ start: new Date(2026, 8, 11), end: null });
      await key('ArrowRight');
      await key('Enter');
      expect(host.range()).toEqual({ start: new Date(2026, 8, 11), end: new Date(2026, 8, 12) });
    });
  });

  it('has no axe violations (single and range)', async () => {
    const { fixture, host, el } = await setup((h) => h.value.set(new Date(2026, 8, 10)));
    await expectNoAxeViolations(el);
    host.mode.set('range');
    host.range.set({ start: new Date(2026, 8, 8), end: new Date(2026, 8, 12) });
    await fixture.whenStable();
    await expectNoAxeViolations(el);
  });
});
