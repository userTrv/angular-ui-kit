import { defineDoc } from '../../../core/doc-model';
import { PaginationBasicExample } from './examples/pagination-basic.example';
import { PaginationCompactExample } from './examples/pagination-compact.example';

export const doc = defineDoc({
  slug: 'pagination',
  name: 'Pagination',
  category: 'Navigation',
  summary: 'Page navigation with ellipsis ranges, a page-size select, a localized range summary and a compact mobile layout.',
  entryPoint: '@usertrv/ui/pagination',
  api: ['UiPagination', 'paginationRange', 'UiPaginationItem', 'UiPaginationRangeOptions'],
  layering:
    'The range logic is a pure, framework-free function, `paginationRange()`, unit-tested on its own and exported for custom paginators. `ui-pagination` is a thin view over it plus `[(page)]` / `[(pageSize)]` models.',
  examples: [
    {
      title: 'With page size',
      component: PaginationBasicExample,
      file: 'pagination-basic.example.ts',
      description: 'Pages are 1-based. Changing the page size keeps the first visible item on screen. Numbers use `Intl.NumberFormat` with the app’s `LOCALE_ID`.',
    },
    {
      title: 'Compact and wide ranges',
      component: PaginationCompactExample,
      file: 'pagination-compact.example.ts',
      description: 'The bar switches to “Page 7 of 49” when its container is narrower than 36rem (a container query, no resize listeners) or when `compact` is set. `siblingCount` and `boundaryCount` shape the range.',
    },
  ],
  keyboard: [
    { keys: 'Tab / Shift + Tab', action: 'Moves between the page-size select, previous, page and next buttons.' },
    { keys: 'Enter / Space', action: 'Activates the focused button (native).' },
  ],
  a11y: [
    'Rendered as a `<nav>` landmark named by the `aria-label` you set on `ui-pagination` (default “Pagination”); give each paginator on a page a distinct name.',
    'The current page has `aria-current="page"`; page buttons are named “Page 3”, previous/next are named “Previous page” / “Next page”.',
    'Previous/next use `aria-disabled` at the ends instead of `disabled`, so focus is not lost to `<body>` when you reach the first or last page.',
    'Ellipses are `aria-hidden`; the summary (“Showing 21–40 of 1,234”) is a polite live region, so page changes are announced.',
    'The current page is indicated by border, weight and colour, and by an outline in forced-colors mode.',
    'Not included: translations of the built-in texts (they are English), and link-based pagination (`<a href>` per page) for server-rendered lists.',
  ],
});
