import { DecimalPipe } from '@angular/common';
import { ListRange } from '@angular/cdk/collections';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';
import { UiColumnWidths, UiTableImports } from '@usertrv/ui/table';

interface RequestLog {
  id: number;
  time: Date;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  region: string;
}

const METHODS = ['GET', 'GET', 'GET', 'POST', 'PUT', 'DELETE'];
const PATHS = [
  '/api/orders',
  '/api/orders/:id',
  '/api/cart',
  '/api/search',
  '/api/users/me',
  '/api/payments',
  '/health',
];
const STATUSES = [200, 200, 200, 200, 201, 204, 304, 400, 404, 500];
const REGIONS = ['eu-west-1', 'eu-central-1', 'us-east-1', 'ap-southeast-2'];

/** Deterministic pseudo-random rows (mulberry32), so the demo looks the same on every load. */
function generateLogs(count: number): RequestLog[] {
  let seed = 20260924;
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = <T>(list: readonly T[]) => list[Math.floor(random() * list.length)];
  const start = new Date(2026, 8, 24, 9, 0, 0).getTime();
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    time: new Date(start + i * 1370),
    method: pick(METHODS),
    path: pick(PATHS),
    status: pick(STATUSES),
    durationMs: Math.round(8 + random() ** 3 * 1200),
    region: pick(REGIONS),
  }));
}

@Component({
  selector: 'docs-table-virtual-example',
  imports: [UiTableImports, UiButton, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-row toolbar">
      <span class="docs-muted" aria-live="off">
        Rendered rows: {{ range().end - range().start }} of {{ logs.length | number }}
      </span>
      <button
        uiButton
        size="sm"
        variant="ghost"
        [disabled]="!hasCustomWidths()"
        (click)="widths.set({})"
      >
        Reset column widths
      </button>
    </div>

    <ui-table
      class="log-table"
      label="Request log, 10,000 requests"
      [data]="logs"
      rowKey="id"
      virtual
      resizable
      stickyFirstColumn
      striped
      [(columnWidths)]="widths"
      (renderedRangeChange)="range.set($event)"
    >
      <ui-column key="id" header="#" sortable align="end" [width]="80" />
      <ui-column key="time" header="Time" sortable [width]="120" [value]="timeOf" />
      <ui-column key="method" header="Method" sortable [width]="100" />
      <ui-column key="path" header="Path" sortable [width]="240" />
      <ui-column key="status" header="Status" sortable align="end" [width]="90" />
      <ui-column key="durationMs" header="Duration (ms)" sortable align="end" [width]="140" />
      <ui-column key="region" header="Region" sortable [width]="150" />
    </ui-table>
  `,
  styles: `
    .toolbar {
      justify-content: space-between;
      margin-bottom: var(--ui-space-3);
    }
    .log-table {
      height: 420px;
    }
  `,
})
export class TableVirtualExample {
  protected readonly logs = generateLogs(10_000);
  protected readonly widths = signal<UiColumnWidths>({});
  protected readonly range = signal<ListRange>({ start: 0, end: 0 });
  protected readonly hasCustomWidths = computed(() => Object.keys(this.widths()).length > 0);

  /** Displays (and sorts by) the time of day; the Date itself would sort the same way. */
  protected readonly timeOf = (log: RequestLog) => log.time.toLocaleTimeString('en-GB');
}
