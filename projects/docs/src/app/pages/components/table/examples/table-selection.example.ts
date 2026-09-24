import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';
import { UiRowKey, UiTableImports } from '@usertrv/ui/table';

interface Deployment {
  id: string;
  service: string;
  environment: 'production' | 'staging';
  version: string;
  author: string;
  deployedAt: Date;
}

const DEPLOYMENTS: Deployment[] = [
  {
    id: 'd-9f21',
    service: 'checkout-api',
    environment: 'production',
    version: '4.12.0',
    author: 'Maya Chen',
    deployedAt: new Date(2026, 8, 23, 16, 5),
  },
  {
    id: 'd-9f1c',
    service: 'search-indexer',
    environment: 'staging',
    version: '2.3.1',
    author: 'Luis Ortega',
    deployedAt: new Date(2026, 8, 23, 14, 40),
  },
  {
    id: 'd-9f0a',
    service: 'billing-worker',
    environment: 'production',
    version: '1.8.7',
    author: 'Priya Nair',
    deployedAt: new Date(2026, 8, 23, 11, 12),
  },
  {
    id: 'd-9ef4',
    service: 'auth-gateway',
    environment: 'production',
    version: '6.0.2',
    author: 'Maya Chen',
    deployedAt: new Date(2026, 8, 22, 18, 30),
  },
  {
    id: 'd-9ee8',
    service: 'notifications',
    environment: 'staging',
    version: '0.9.14',
    author: 'Tomás Silva',
    deployedAt: new Date(2026, 8, 22, 9, 55),
  },
  {
    id: 'd-9ed1',
    service: 'web-storefront',
    environment: 'production',
    version: '12.4.0',
    author: 'Ada Okafor',
    deployedAt: new Date(2026, 8, 21, 17, 20),
  },
];

@Component({
  selector: 'docs-table-selection-example',
  imports: [UiTableImports, UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-row bulk-bar" role="toolbar" aria-label="Bulk actions">
      <span aria-live="polite"
        >{{ selection().length }} of {{ deployments().length }} selected</span
      >
      <button uiButton size="sm" [disabled]="!selection().length" (click)="rollBack()">
        Roll back
      </button>
      <button
        uiButton
        size="sm"
        variant="ghost"
        [disabled]="!selection().length"
        (click)="selection.set([])"
      >
        Clear selection
      </button>
    </div>

    <ui-table
      label="Recent deployments"
      [data]="deployments()"
      rowKey="id"
      selectionMode="multiple"
      primaryColumn="service"
      [(selection)]="selection"
    >
      <ui-column key="service" header="Service" sortable [width]="170" />
      <ui-column key="environment" header="Environment" sortable [width]="130" />
      <ui-column key="version" header="Version" [width]="100" />
      <ui-column key="author" header="Author" sortable [width]="140" />
      <ui-column key="deployedAt" header="Deployed" sortable [width]="140" />
      <ng-template uiTableEmpty>Everything has been rolled back.</ng-template>
    </ui-table>

    <p class="docs-muted" aria-live="polite">{{ lastAction() }}</p>
  `,
  styles: `
    .bulk-bar {
      margin-bottom: var(--ui-space-3);
      min-height: var(--ui-control-height-md);
    }
  `,
})
export class TableSelectionExample {
  protected readonly deployments = signal(DEPLOYMENTS);
  protected readonly selection = signal<readonly UiRowKey[]>(['d-9f0a']);
  protected readonly lastAction = signal('Tip: Shift+click a second checkbox to select a range.');

  private readonly selectedServices = computed(() =>
    this.deployments()
      .filter((d) => this.selection().includes(d.id))
      .map((d) => d.service),
  );

  protected rollBack(): void {
    const services = this.selectedServices();
    const ids = new Set(this.selection());
    this.deployments.update((list) => list.filter((d) => !ids.has(d.id)));
    this.selection.set([]);
    this.lastAction.set(`Rolled back ${services.join(', ')}.`);
  }
}
