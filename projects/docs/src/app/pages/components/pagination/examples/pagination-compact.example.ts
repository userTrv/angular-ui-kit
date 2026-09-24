import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiPagination } from '@usertrv/ui/pagination';

@Component({
  selector: 'docs-pagination-compact-example',
  imports: [UiPagination],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="paginators">
      <ui-pagination
        aria-label="Search results pages"
        compact
        [length]="486"
        [pageSize]="10"
        [pageSizeOptions]="[]"
        [(page)]="page"
      />
      <ui-pagination
        aria-label="Audit log pages"
        [length]="12400"
        [pageSize]="50"
        [pageSizeOptions]="[]"
        [siblingCount]="2"
        [showSummary]="false"
        [(page)]="logPage"
      />
    </div>
  `,
  styles: `
    .paginators {
      display: grid;
      gap: 1.5rem;
    }
  `,
})
export class PaginationCompactExample {
  protected readonly page = signal(7);
  protected readonly logPage = signal(120);
}
