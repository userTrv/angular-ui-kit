import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiSort, UiTableImports } from '@usertrv/ui/table';

interface Invoice {
  number: string;
  customer: string;
  issued: Date;
  due: Date;
  amount: number;
}

const INVOICES: Invoice[] = [
  {
    number: 'INV-2026-0142',
    customer: 'Northwind Traders',
    issued: new Date(2026, 8, 2),
    due: new Date(2026, 9, 2),
    amount: 12480,
  },
  {
    number: 'INV-2026-0139',
    customer: 'Ångström Labs',
    issued: new Date(2026, 7, 28),
    due: new Date(2026, 8, 27),
    amount: 3150.5,
  },
  {
    number: 'INV-2026-0145',
    customer: 'Émile & Fils',
    issued: new Date(2026, 8, 9),
    due: new Date(2026, 9, 9),
    amount: 890,
  },
  {
    number: 'INV-2026-0131',
    customer: 'Contoso Health',
    issued: new Date(2026, 7, 14),
    due: new Date(2026, 8, 13),
    amount: 45200,
  },
  {
    number: 'INV-2026-0148',
    customer: 'Blue Yonder Airlines',
    issued: new Date(2026, 8, 15),
    due: new Date(2026, 9, 15),
    amount: 7600,
  },
  {
    number: 'INV-2026-0136',
    customer: 'Zürich Freight',
    issued: new Date(2026, 7, 21),
    due: new Date(2026, 8, 20),
    amount: 18975.25,
  },
];

@Component({
  selector: 'docs-table-basic-example',
  imports: [UiTableImports, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-table label="Invoices" [data]="invoices" rowKey="number" [(sort)]="sort">
      <ui-column key="number" header="Invoice" sortable [width]="150" />
      <ui-column key="customer" header="Customer" sortable [width]="200" />
      <ui-column key="issued" header="Issued" sortable [width]="130" />
      <ui-column key="due" header="Due" sortable [width]="130" />
      <ui-column key="amount" header="Amount" sortable align="end" [width]="130">
        <ng-template uiCell [uiCellOf]="invoices" let-invoice>{{
          invoice.amount | currency: 'EUR'
        }}</ng-template>
      </ui-column>
    </ui-table>
    <p class="docs-muted">
      @if (sort(); as s) {
        Sorted by {{ s.key }}, {{ s.direction === 'asc' ? 'ascending' : 'descending' }}
      } @else {
        Unsorted (data order)
      }
    </p>
  `,
})
export class TableBasicExample {
  protected readonly invoices = INVOICES;
  protected readonly sort = signal<UiSort | null>({ key: 'issued', direction: 'desc' });
}
