import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { UiSort, UiTableImports, sortBy } from '@usertrv/ui/table';

interface Order {
  id: string;
  customer: string;
  country: string;
  total: number;
  placedAt: Date;
}

const ORDERS: Order[] = [
  {
    id: 'SO-58210',
    customer: 'Kaito Yamamoto',
    country: 'Japan',
    total: 312.4,
    placedAt: new Date(2026, 8, 24, 8, 14),
  },
  {
    id: 'SO-58207',
    customer: 'Sofia Rossi',
    country: 'Italy',
    total: 89.9,
    placedAt: new Date(2026, 8, 23, 21, 2),
  },
  {
    id: 'SO-58205',
    customer: 'Liam Murphy',
    country: 'Ireland',
    total: 1240,
    placedAt: new Date(2026, 8, 23, 17, 45),
  },
  {
    id: 'SO-58199',
    customer: 'Amara Nwosu',
    country: 'Nigeria',
    total: 56.25,
    placedAt: new Date(2026, 8, 23, 9, 30),
  },
  {
    id: 'SO-58196',
    customer: 'Jonas Becker',
    country: 'Germany',
    total: 478,
    placedAt: new Date(2026, 8, 22, 15, 5),
  },
  {
    id: 'SO-58190',
    customer: 'Élodie Martin',
    country: 'France',
    total: 199.99,
    placedAt: new Date(2026, 8, 22, 10, 11),
  },
];

/** Stands in for an HTTP call: sorts on the "server" and answers after a delay. */
function fetchOrders(sort: UiSort | null): Promise<Order[]> {
  const rows = sort ? sortBy(ORDERS, (o) => o[sort.key as keyof Order], sort.direction) : ORDERS;
  return new Promise((resolve) => setTimeout(() => resolve(rows), 700));
}

@Component({
  selector: 'docs-table-server-example',
  imports: [UiTableImports, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-table
      label="Orders"
      [data]="orders()"
      rowKey="id"
      sortMode="server"
      [loading]="loading()"
      [sort]="sort()"
      (sortChange)="load($event)"
    >
      <ui-column key="id" header="Order" sortable [width]="120" />
      <ui-column key="customer" header="Customer" sortable [width]="170" />
      <ui-column key="country" header="Country" sortable [width]="120" />
      <ui-column key="placedAt" header="Placed" sortable [width]="140" />
      <ui-column key="total" header="Total" sortable align="end" [width]="120">
        <ng-template uiCell [uiCellOf]="orders()" let-order>{{
          order.total | currency: 'EUR'
        }}</ng-template>
      </ui-column>
    </ui-table>
    <p class="docs-muted" aria-live="polite">{{ loading() ? 'Loading orders…' : status() }}</p>
  `,
})
export class TableServerExample {
  protected readonly orders = signal<Order[]>([]);
  protected readonly sort = signal<UiSort | null>(null);
  protected readonly loading = signal(true);
  protected readonly status = signal('');
  private request = 0;
  private destroyed = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => (this.destroyed = true));
    this.load(null);
  }

  protected async load(sort: UiSort | null): Promise<void> {
    const request = ++this.request;
    this.sort.set(sort);
    this.loading.set(true);
    const rows = await fetchOrders(sort);
    // Ignore responses that were overtaken by a newer sort request.
    if (this.destroyed || request !== this.request) return;
    this.orders.set(rows);
    this.loading.set(false);
    this.status.set(
      sort
        ? `${rows.length} orders sorted by ${sort.key}, ${sort.direction}ending`
        : `${rows.length} orders`,
    );
  }
}
