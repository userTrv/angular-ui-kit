import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { UiPagination } from '@usertrv/ui/pagination';

interface Order {
  id: number;
  customer: string;
  total: number;
}

const CUSTOMERS = ['Northwind', 'Contoso', 'Fabrikam', 'Tailspin', 'Wingtip', 'Litware'];
const ORDERS: Order[] = Array.from({ length: 1234 }, (_, i) => ({
  id: 10001 + i,
  customer: CUSTOMERS[i % CUSTOMERS.length],
  total: ((i * 37) % 900) + 49.9,
}));

@Component({
  selector: 'docs-pagination-basic-example',
  imports: [UiPagination],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="orders" aria-label="Orders">
      @for (order of visible(); track order.id) {
        <li>
          <span>#{{ order.id }} · {{ order.customer }}</span>
          <span>{{ order.total.toFixed(2) }} €</span>
        </li>
      }
    </ul>
    <ui-pagination
      aria-label="Orders pages"
      [length]="orders.length"
      [pageSizeOptions]="[5, 10, 25]"
      [(page)]="page"
      [(pageSize)]="pageSize"
    />
  `,
  styles: `
    .orders {
      margin: 0 0 1rem;
      padding: 0;
      list-style: none;
    }
    .orders li {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--ui-color-border);
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class PaginationBasicExample {
  protected readonly orders = ORDERS;
  protected readonly page = signal(3);
  protected readonly pageSize = signal(5);
  protected readonly visible = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.orders.slice(start, start + this.pageSize());
  });
}
