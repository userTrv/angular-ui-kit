import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  numberAttribute,
} from '@angular/core';
import { injectId } from '@usertrv/ui/a11y';
import { paginationRange } from './pagination-range';

const CHEVRON_LEFT = 'M9.8 12.3a.75.75 0 0 1-1.06 0L4.97 8.53a.75.75 0 0 1 0-1.06L8.74 3.7a.75.75 0 1 1 1.06 1.06L6.56 8l3.24 3.24a.75.75 0 0 1 0 1.06Z';
const CHEVRON_RIGHT = 'M6.2 3.7a.75.75 0 0 1 1.06 0l3.77 3.77a.75.75 0 0 1 0 1.06l-3.77 3.77a.75.75 0 1 1-1.06-1.06L9.44 8 6.2 4.76a.75.75 0 0 1 0-1.06Z';

/**
 * Page navigation for tables and lists: a `<nav>` landmark with previous/next buttons, numbered
 * pages with `aria-current="page"`, ellipsis gaps, a "Showing 21–40 of 1,234" summary and an
 * optional page-size select. Pages are 1-based. Collapses to "Page 3 of 62" when its container
 * is narrower than 36rem (container query) or when `compact` is set.
 */
@Component({
  selector: 'ui-pagination',
  exportAs: 'uiPagination',
  template: `
    <nav class="ui-pagination__nav" [attr.aria-label]="ariaLabel()">
      @if (showSummary()) {
        <p class="ui-pagination__summary" aria-live="polite">{{ summary() }}</p>
      }
      @if (pageSizeOptions().length > 1) {
        <div class="ui-pagination__size">
          <label [for]="sizeSelectId">Rows per page</label>
          <select
            class="ui-pagination__select"
            [id]="sizeSelectId"
            [value]="pageSize()"
            (change)="changePageSize($event)"
          >
            @for (size of pageSizeOptions(); track size) {
              <option [value]="size" [selected]="size === pageSize()">{{ size }}</option>
            }
          </select>
        </div>
      }
      <ul class="ui-pagination__list">
        <li>
          <button
            type="button"
            class="ui-pagination__button ui-pagination__step"
            aria-label="Previous page"
            [attr.aria-disabled]="current() <= 1 || null"
            (click)="goTo(current() - 1)"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path [attr.d]="chevronLeft" /></svg>
          </button>
        </li>
        @for (item of items(); track item) {
          <li class="ui-pagination__slot">
            @if (item === 'start-ellipsis' || item === 'end-ellipsis') {
              <span class="ui-pagination__ellipsis" aria-hidden="true">…</span>
            } @else {
              <button
                type="button"
                class="ui-pagination__button ui-pagination__page"
                [attr.aria-label]="'Page ' + item"
                [attr.aria-current]="item === current() ? 'page' : null"
                (click)="goTo(item)"
              >
                {{ format(item) }}
              </button>
            }
          </li>
        }
        <li class="ui-pagination__compact-status">
          Page {{ format(current()) }} of {{ format(pageCount()) }}
        </li>
        <li>
          <button
            type="button"
            class="ui-pagination__button ui-pagination__step"
            aria-label="Next page"
            [attr.aria-disabled]="current() >= pageCount() || null"
            (click)="goTo(current() + 1)"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path [attr.d]="chevronRight" /></svg>
          </button>
        </li>
      </ul>
    </nav>
  `,
  styleUrl: './pagination.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-pagination',
    '[class.ui-pagination--compact]': 'compact()',
    // The accessible name belongs to the <nav> landmark, not to this generic host element.
    '[attr.aria-label]': 'null',
  },
})
export class UiPagination {
  private readonly numberFormat = new Intl.NumberFormat(inject(LOCALE_ID));

  /** Current page, 1-based. Two-way bindable: `[(page)]`. */
  readonly page = model(1);
  /** Items per page. Two-way bindable: `[(pageSize)]`. */
  readonly pageSize = model(20);
  /** Total number of items. */
  readonly length = input.required({ transform: numberAttribute });
  /** Choices for the page-size select; the select is hidden when there are fewer than two. */
  readonly pageSizeOptions = input<readonly number[]>([10, 20, 50, 100]);
  /** Pages shown on each side of the current page. */
  readonly siblingCount = input(1, { transform: numberAttribute });
  /** Pages always shown at the start and the end. */
  readonly boundaryCount = input(1, { transform: numberAttribute });
  /** Shows the "Showing 21–40 of 1,234" summary (a polite live region). */
  readonly showSummary = input(true, { transform: booleanAttribute });
  /** Forces the compact "Page 3 of 62" layout regardless of the available width. */
  readonly compact = input(false, { transform: booleanAttribute });
  /** Accessible name of the `<nav>` landmark; make it unique when a page has several paginators. */
  readonly ariaLabel = input('Pagination', { alias: 'aria-label' });

  protected readonly sizeSelectId = injectId('ui-pagination-size');
  protected readonly chevronLeft = CHEVRON_LEFT;
  protected readonly chevronRight = CHEVRON_RIGHT;

  /** Number of pages (at least 1). */
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.length() / Math.max(1, this.pageSize()))));

  protected readonly current = computed(() => Math.min(Math.max(1, this.page()), this.pageCount()));

  protected readonly items = computed(() =>
    paginationRange({
      page: this.current(),
      pageCount: this.pageCount(),
      siblingCount: this.siblingCount(),
      boundaryCount: this.boundaryCount(),
    }),
  );

  protected readonly summary = computed(() => {
    const total = this.length();
    if (total <= 0) return 'No results';
    const first = (this.current() - 1) * this.pageSize() + 1;
    const last = Math.min(total, this.current() * this.pageSize());
    return `Showing ${this.format(first)}–${this.format(last)} of ${this.format(total)}`;
  });

  /** Navigates to `page` (clamped to the existing pages). */
  goTo(page: number): void {
    const target = Math.min(Math.max(1, page), this.pageCount());
    if (target !== this.page()) this.page.set(target);
  }

  protected format(value: number): string {
    return this.numberFormat.format(value);
  }

  protected changePageSize(event: Event): void {
    const size = Number((event.target as HTMLSelectElement).value);
    const firstItem = (this.current() - 1) * this.pageSize();
    this.pageSize.set(size);
    // Keep the first visible item on screen after the page size changes.
    this.goTo(Math.floor(firstItem / size) + 1);
  }
}
