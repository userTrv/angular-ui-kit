import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ListRange } from '@angular/cdk/collections';
import { press } from '../test-utils';
import { UiTableImports } from './index';

interface LogLine {
  id: number;
  message: string;
}

const ROWS: LogLine[] = Array.from({ length: 10_000 }, (_, i) => ({
  id: i + 1,
  message: `Request ${i + 1} served`,
}));

@Component({
  imports: [UiTableImports],
  template: `
    <ui-table
      label="Request log"
      [data]="rows()"
      rowKey="id"
      virtual
      [rowHeight]="40"
      style="height: 400px"
      (renderedRangeChange)="range.set($event)"
    >
      <ui-column key="id" header="#" [width]="80" sortable />
      <ui-column key="message" header="Message" />
    </ui-table>
  `,
})
class Host {
  readonly rows = signal(ROWS);
  readonly range = signal<ListRange | null>(null);
}

/** Waits for the CDK viewport, which renders in a microtask + animation frame after the scroll/resize. */
async function settle(fixture: { whenStable(): Promise<unknown> }): Promise<void> {
  for (let i = 0; i < 4; i++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await fixture.whenStable();
  }
}

describe('UiTable virtual scroll', () => {
  // jsdom has no layout: give the scroll container a size so the CDK computes a real window.
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(400);
  });
  afterEach(() => vi.restoreAllMocks());

  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await settle(fixture);
    const el = fixture.nativeElement as HTMLElement;
    const viewport = fixture.debugElement.query(
      (d) => d.componentInstance instanceof CdkVirtualScrollViewport,
    ).componentInstance as CdkVirtualScrollViewport;
    const bodyRows = () => Array.from(el.querySelectorAll<HTMLElement>('.ui-table__row--body'));
    return { fixture, host: fixture.componentInstance, el, viewport, bodyRows };
  }

  it('renders only a window of the 10 000 rows and reports the real size to AT', async () => {
    const { el, bodyRows, host } = await setup();
    const rendered = bodyRows().length;
    expect(rendered).toBeGreaterThan(5);
    expect(rendered).toBeLessThan(40);
    expect(el.querySelector('[role=grid]')?.getAttribute('aria-rowcount')).toBe('10001');
    expect(bodyRows()[0].getAttribute('aria-rowindex')).toBe('2');
    expect(host.range()).toEqual({ start: 0, end: rendered });
    expect(bodyRows()[0].style.height).toBe('');
    expect((el.querySelector('ui-table') as HTMLElement).style.getPropertyValue('--_row-h')).toBe(
      '40px',
    );
  });

  it('keeps aria-rowindex equal to the data position after scrolling', async () => {
    const { fixture, viewport, bodyRows } = await setup();
    // jsdom does not scroll: emulate the offset a real scroll to row 5000 would produce.
    vi.spyOn(viewport, 'measureScrollOffset').mockReturnValue(5000 * 40);
    viewport.scrollable!.getElementRef().nativeElement.dispatchEvent(new Event('scroll'));
    await settle(fixture);
    const rows = bodyRows();
    const first = Number(rows[0].getAttribute('aria-rowindex'));
    expect(first).toBeGreaterThan(4900);
    expect(rows.length).toBeLessThan(40);
    expect(rows[0].textContent).toContain(`Request ${first - 1} served`);
    rows.forEach((row, i) => expect(Number(row.getAttribute('aria-rowindex'))).toBe(first + i));
  });

  it('sorts all rows, not only the rendered window', async () => {
    const { fixture, el, bodyRows } = await setup();
    const sortButton = el.querySelector('[role=columnheader] button') as HTMLButtonElement;
    sortButton.click();
    sortButton.click();
    await settle(fixture);
    expect(bodyRows()[0].textContent).toContain('Request 10000 served');
  });

  it('scrolls a far row into the rendered range and focuses it on Ctrl+End', async () => {
    const { fixture, el, viewport, bodyRows } = await setup();
    const scrollTo = vi.spyOn(viewport, 'scrollToIndex').mockImplementation(() => undefined);
    const firstCell = el.querySelector('[role=gridcell]') as HTMLElement;
    firstCell.focus();
    await fixture.whenStable();
    press(firstCell, 'End', { ctrlKey: true });
    expect(scrollTo).toHaveBeenCalledWith(9999);

    // jsdom does not scroll: emulate the scroll offset the viewport would now have.
    const scroller = viewport.scrollable!.getElementRef().nativeElement as HTMLElement;
    vi.spyOn(viewport, 'measureScrollOffset').mockReturnValue(9999 * 40);
    scroller.dispatchEvent(new Event('scroll'));
    await settle(fixture);

    const last = bodyRows().at(-1)!;
    expect(last.getAttribute('aria-rowindex')).toBe('10001');
    expect(document.activeElement).toBe(last.querySelectorAll('[role=gridcell]')[1]);
  });
});
