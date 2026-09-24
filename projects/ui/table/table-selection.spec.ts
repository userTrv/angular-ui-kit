import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations, press } from '../test-utils';
import { UiRowKey, UiTableImports } from './index';

interface Deployment {
  id: number;
  service: string;
}

const DEPLOYMENTS: Deployment[] = [
  { id: 11, service: 'checkout-api' },
  { id: 12, service: 'search' },
  { id: 13, service: 'billing-worker' },
  { id: 14, service: 'auth' },
  { id: 15, service: 'web' },
];

@Component({
  imports: [UiTableImports],
  template: `
    <ui-table
      label="Deployments"
      [data]="data"
      rowKey="id"
      selectionMode="multiple"
      primaryColumn="service"
      [(selection)]="selection"
    >
      <ui-column key="id" header="ID" />
      <ui-column key="service" header="Service" />
    </ui-table>
  `,
})
class Host {
  readonly data = DEPLOYMENTS;
  readonly selection = signal<readonly UiRowKey[]>([]);
}

describe('UiTable selection', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const all = el.querySelector('[role=columnheader] input[type=checkbox]') as HTMLInputElement;
    const rows = () => Array.from(el.querySelectorAll<HTMLElement>('.ui-table__row--body'));
    const boxes = () =>
      rows().map((r) => r.querySelector('input[type=checkbox]') as HTMLInputElement);
    const shiftClick = (box: HTMLInputElement) =>
      box.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }),
      );
    return { fixture, host: fixture.componentInstance, el, all, rows, boxes, shiftClick };
  }

  it('labels the checkboxes and marks the grid multiselectable', async () => {
    const { el, all, boxes } = await setup();
    expect(all.getAttribute('aria-label')).toBe('Select all rows');
    expect(boxes()[1].getAttribute('aria-label')).toBe('Select row search');
    expect(el.querySelector('[role=grid]')?.getAttribute('aria-multiselectable')).toBe('true');
  });

  it('toggles a row and reflects it with aria-selected and styling', async () => {
    const { fixture, host, rows, boxes } = await setup();
    expect(rows()[0].getAttribute('aria-selected')).toBe('false');
    boxes()[0].click();
    await fixture.whenStable();
    expect(host.selection()).toEqual([11]);
    expect(rows()[0].getAttribute('aria-selected')).toBe('true');
    expect(rows()[0].classList).toContain('ui-table__row--selected');
    boxes()[0].click();
    await fixture.whenStable();
    expect(host.selection()).toEqual([]);
  });

  it('shows an indeterminate select-all and selects / clears every row', async () => {
    const { fixture, host, all } = await setup();
    host.selection.set([12]);
    await fixture.whenStable();
    expect(all.indeterminate).toBe(true);
    expect(all.checked).toBe(false);

    all.click();
    await fixture.whenStable();
    expect(host.selection()).toEqual([12, 11, 13, 14, 15]);
    expect(all.checked).toBe(true);
    expect(all.indeterminate).toBe(false);

    all.click();
    await fixture.whenStable();
    expect(host.selection()).toEqual([]);
  });

  it('keeps keys that are not in the current data', async () => {
    const { fixture, host, all } = await setup();
    host.selection.set([99]);
    await fixture.whenStable();
    all.click();
    await fixture.whenStable();
    expect(host.selection()).toContain(99);
  });

  it('selects a range with Shift+click from the last clicked row, in both directions', async () => {
    const { fixture, host, boxes, shiftClick } = await setup();
    boxes()[1].click();
    await fixture.whenStable();
    shiftClick(boxes()[3]);
    await fixture.whenStable();
    expect([...host.selection()].sort()).toEqual([12, 13, 14]);

    // The anchor stays on row 12, so a second Shift+click re-extends from it.
    shiftClick(boxes()[0]);
    await fixture.whenStable();
    expect([...host.selection()].sort()).toEqual([11, 12, 13, 14]);
  });

  it('extends the range with Shift+Space on a row checkbox', async () => {
    const { fixture, host, boxes } = await setup();
    boxes()[4].click();
    await fixture.whenStable();
    const event = press(boxes()[2], ' ', { shiftKey: true });
    await fixture.whenStable();
    expect(event.defaultPrevented).toBe(true);
    expect([...host.selection()].sort()).toEqual([13, 14, 15]);
  });

  it('has no axe violations with a partial selection', async () => {
    const { fixture, host, el } = await setup();
    host.selection.set([11, 13]);
    await fixture.whenStable();
    await expectNoAxeViolations(el);
  });
});
