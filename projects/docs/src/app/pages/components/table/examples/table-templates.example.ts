import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiTableImports } from '@usertrv/ui/table';

type ServiceStatus = 'operational' | 'degraded' | 'outage';

interface Service {
  name: string;
  owner: string;
  status: ServiceStatus;
  uptime: number;
  runbook: string;
}

const SERVICES: Service[] = [
  {
    name: 'checkout-api',
    owner: 'Payments',
    status: 'operational',
    uptime: 99.98,
    runbook: '#checkout-api',
  },
  {
    name: 'search-indexer',
    owner: 'Discovery',
    status: 'degraded',
    uptime: 99.41,
    runbook: '#search-indexer',
  },
  {
    name: 'billing-worker',
    owner: 'Payments',
    status: 'operational',
    uptime: 99.95,
    runbook: '#billing-worker',
  },
  {
    name: 'media-transcoder',
    owner: 'Content',
    status: 'outage',
    uptime: 97.2,
    runbook: '#media-transcoder',
  },
  {
    name: 'auth-gateway',
    owner: 'Identity',
    status: 'operational',
    uptime: 100,
    runbook: '#auth-gateway',
  },
];

const STATUS_ORDER: Record<ServiceStatus, number> = { outage: 0, degraded: 1, operational: 2 };

@Component({
  selector: 'docs-table-templates-example',
  imports: [UiTableImports, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-table
      label="Service health"
      [data]="services"
      rowKey="name"
      [sort]="{ key: 'status', direction: 'asc' }"
    >
      <ui-column key="name" header="Service" sortable [width]="190">
        <ng-template uiCell [uiCellOf]="services" let-service>
          <a class="service-link" [href]="service.runbook">{{ service.name }}</a>
        </ng-template>
      </ui-column>
      <ui-column key="owner" header="Owner" sortable [width]="130" />
      <ui-column key="status" header="Status" sortable [width]="150" [compare]="byStatus">
        <ng-template uiCell [uiCellOf]="services" let-service>
          <span [class]="'status status--' + service.status">
            <span class="status__dot" aria-hidden="true"></span>
            {{ labels[service.status] }}
          </span>
        </ng-template>
      </ui-column>
      <ui-column key="uptime" header="Uptime" sortable align="end" [width]="140">
        <ng-template uiHeaderCell let-header>
          {{ header }} <span class="docs-muted">30 d</span>
        </ng-template>
        <ng-template uiCell [uiCellOf]="services" let-service
          >{{ service.uptime | number: '1.2-2' }} %</ng-template
        >
      </ui-column>
    </ui-table>
  `,
  styles: `
    .service-link {
      color: var(--ui-color-primary-text);
      font-family: var(--ui-font-family-mono);
      font-size: var(--ui-font-size-sm);
    }
    .status {
      display: inline-flex;
      align-items: center;
      gap: var(--ui-space-1-5);
      padding: 0 var(--ui-space-2);
      border-radius: var(--ui-radius-full);
      font-size: var(--ui-font-size-xs);
      font-weight: var(--ui-font-weight-medium);
      line-height: 1.5rem;
    }
    .status__dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: currentColor;
    }
    .status--operational {
      background: var(--ui-color-success-subtle);
      color: var(--ui-color-success-text);
    }
    .status--degraded {
      background: var(--ui-color-warning-subtle);
      color: var(--ui-color-warning-text);
    }
    .status--outage {
      background: var(--ui-color-danger-subtle);
      color: var(--ui-color-danger-text);
    }
    @media (forced-colors: active) {
      .status {
        border: 1px solid CanvasText;
      }
    }
  `,
})
export class TableTemplatesExample {
  protected readonly services = SERVICES;
  protected readonly labels: Record<ServiceStatus, string> = {
    operational: 'Operational',
    degraded: 'Degraded',
    outage: 'Outage',
  };

  /** Sorts by severity instead of alphabetically. */
  protected readonly byStatus = (a: Service, b: Service) =>
    STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
}
