import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations, press } from '../test-utils';
import { UiSort, UiSortMode, UiTableImports } from './index';

interface Invoice {
  id: string;
  customer: string;
  amount: number | null;
  issued: Date;
  status: 'paid' | 'overdue';
}

export const INVOICES: Invoice[] = [
  {
    id: 'INV-3',
    customer: 'Örebro Bygg',
    amount: 1200,
    issued: new Date('2026-03-02'),
    status: 'paid',
  },
  { id: 'INV-1', customer: 'Acme', amount: 90, issued: new Date('2026-01-15'), status: 'overdue' },
  { id: 'INV-2', customer: 'Zenith', amount: null, issued: new Date('2026-02-20'), status: 'paid' },
  {
    id: 'INV-4',
    customer: 'Bellweather',
    amount: 450,
    issued: new Date('2025-12-01'),
    status: 'paid',
  },
];

@Component({
  imports: [UiTableImports],
  template: `
    <ui-table
      label="Invoices"
      [data]="data()"
      rowKey="id"
      [sortMode]="sortMode()"
      [loading]="loading()"
      [(sort)]="sort"
    >
      <ui-column key="id" header="Invoice" sortable />
      <ui-column key="customer" header="Customer" sortable />
      <ui-column key="amount" header="Amount" sortable align="end" />
      <ui-column key="issued" header="Issued" sortable />
      <ui-column key="status" header="Status">
        <ng-template uiCell [uiCellOf]="data()" let-row>
          <span class="status">{{ row.status.toUpperCase() }}</span>
        </ng-template>
      </ui-column>
      <ng-template uiTableEmpty>No invoices yet</ng-template>
    </ui-table>
  `,
})
class Host {
  readonly data = signal<Invoice[]>(INVOICES);
  readonly sort = signal<UiSort | null>(null);
  readonly sortMode = signal<UiSortMode>('client');
  readonly loading = signal(false);
}

describe('UiTable', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const headers = () => Array.from(el.querySelectorAll<HTMLElement>('[role=columnheader]'));
    const sortButton = (i: number) => headers()[i].querySelector('button') as HTMLButtonElement;
    const column = (i: number) =>
      Array.from(el.querySelectorAll('.ui-table__row--body')).map((row) =>
        row.querySelectorAll('[role=gridcell]')[i].textContent?.trim(),
      );
    return { fixture, host: fixture.componentInstance, el, headers, sortButton, column };
  }

  it('renders a labelled grid with header and body rows', async () => {
    const { el, headers } = await setup();
    const grid = el.querySelector('[role=grid]') as HTMLElement;
    expect(grid.getAttribute('aria-label')).toBe('Invoices');
    expect(grid.getAttribute('aria-rowcount')).toBe('5');
    expect(grid.getAttribute('aria-colcount')).toBe('5');
    expect(headers().map((h) => h.textContent?.trim())).toEqual([
      'Invoice',
      'Customer',
      'Amount',
      'Issued',
      'Status',
    ]);
    const rows = el.querySelectorAll('.ui-table__row--body');
    expect(Array.from(rows).map((r) => r.getAttribute('aria-rowindex'))).toEqual([
      '2',
      '3',
      '4',
      '5',
    ]);
    expect(rows[0].querySelector('.status')?.textContent).toBe('PAID');
  });

  it('cycles sort asc → desc → none on click and sets aria-sort only on the sorted header', async () => {
    const { fixture, host, headers, sortButton, column } = await setup();
    sortButton(0).click();
    await fixture.whenStable();
    expect(host.sort()).toEqual({ key: 'id', direction: 'asc' });
    expect(headers()[0].getAttribute('aria-sort')).toBe('ascending');
    expect(headers()[1].hasAttribute('aria-sort')).toBe(false);
    expect(column(0)).toEqual(['INV-1', 'INV-2', 'INV-3', 'INV-4']);

    sortButton(0).click();
    await fixture.whenStable();
    expect(headers()[0].getAttribute('aria-sort')).toBe('descending');
    expect(column(0)).toEqual(['INV-4', 'INV-3', 'INV-2', 'INV-1']);

    sortButton(0).click();
    await fixture.whenStable();
    expect(host.sort()).toBeNull();
    expect(headers()[0].hasAttribute('aria-sort')).toBe(false);
    expect(column(0)).toEqual(['INV-3', 'INV-1', 'INV-2', 'INV-4']);
  });

  it('activates sort with Enter through the native header button', async () => {
    const { fixture, host, sortButton } = await setup();
    const button = sortButton(1);
    button.focus();
    // A native <button> turns Enter into a click; jsdom does not, so simulate both halves.
    const enter = press(button, 'Enter');
    if (!enter.defaultPrevented) button.click();
    await fixture.whenStable();
    expect(host.sort()).toEqual({ key: 'customer', direction: 'asc' });
  });

  it('sorts numbers with empty values last, dates chronologically', async () => {
    const { fixture, host, column } = await setup();
    host.sort.set({ key: 'amount', direction: 'desc' });
    await fixture.whenStable();
    expect(column(2)).toEqual(['1200', '450', '90', '']);
    host.sort.set({ key: 'issued', direction: 'asc' });
    await fixture.whenStable();
    expect(column(0)).toEqual(['INV-4', 'INV-1', 'INV-2', 'INV-3']);
  });

  it('only emits the model in server sort mode', async () => {
    const { fixture, host, sortButton, column } = await setup();
    host.sortMode.set('server');
    await fixture.whenStable();
    sortButton(0).click();
    await fixture.whenStable();
    expect(host.sort()).toEqual({ key: 'id', direction: 'asc' });
    expect(column(0)).toEqual(['INV-3', 'INV-1', 'INV-2', 'INV-4']);
  });

  it('shows the empty template in a full-width row', async () => {
    const { fixture, host, el } = await setup();
    host.data.set([]);
    await fixture.whenStable();
    const cell = el.querySelector('.ui-table__empty') as HTMLElement;
    expect(cell.textContent?.trim()).toBe('No invoices yet');
    expect(cell.getAttribute('aria-colspan')).toBe('5');
    expect(el.querySelector('[role=grid]')?.getAttribute('aria-rowcount')).toBe('2');
  });

  it('marks the grid busy and renders hidden skeleton rows while loading without data', async () => {
    const { fixture, host, el } = await setup();
    host.data.set([]);
    host.loading.set(true);
    await fixture.whenStable();
    expect(el.querySelector('[role=grid]')?.getAttribute('aria-busy')).toBe('true');
    expect(el.querySelectorAll('.ui-table__row--skeleton[aria-hidden=true]').length).toBe(5);
    expect(el.querySelector('.ui-table__empty')).toBeNull();
  });

  it('has no axe violations', async () => {
    const { fixture, host, el } = await setup();
    host.sort.set({ key: 'customer', direction: 'asc' });
    await fixture.whenStable();
    await expectNoAxeViolations(el);
  });
});
