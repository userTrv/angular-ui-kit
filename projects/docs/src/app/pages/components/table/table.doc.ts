import { defineDoc } from '../../../core/doc-model';
import { TableBasicExample } from './examples/table-basic.example';
import { TableSelectionExample } from './examples/table-selection.example';
import { TableServerExample } from './examples/table-server.example';
import { TableTemplatesExample } from './examples/table-templates.example';
import { TableVirtualExample } from './examples/table-virtual.example';

export const doc = defineDoc({
  slug: 'table',
  name: 'Data table',
  category: 'Data display',
  summary:
    'Keyboard-navigable data grid with sorting, row selection, column resizing, sticky header and virtual scrolling for 10 000+ rows.',
  entryPoint: '@usertrv/ui/table',
  api: [
    'UiTable',
    'UiColumn',
    'UiCellDef',
    'UiHeaderCellDef',
    'UiTableEmpty',
    'UiColumnResize',
    'UiGrid',
    'UiGridCell',
    'sortBy',
    'nextSort',
    'compareValues',
  ],
  layering:
    '`UiTable` is the styled layer: it owns data, sorting, selection and widths, and renders rows as CSS grids that share one `grid-template-columns` custom property, so the sticky header and virtualised rows stay aligned. Under it sit three headless pieces you can reuse: `UiGrid` + `UiGridCell` (APG data-grid keyboard model with roving tabindex that survives virtualisation), `UiColumnResize` (a controlled `role="separator"` for pointer and keyboard resizing), and the pure `sortBy` / `nextSort` / `compareValues` helpers, which also make a good fake server in tests.',
  examples: [
    {
      title: 'Sortable',
      component: TableBasicExample,
      file: 'table-basic.example.ts',
      description:
        'Click a header or press **Enter** on it: ascending → descending → unsorted. Strings use `Intl.Collator` (note where "Ångström" and "Émile" land), numbers and dates compare by value, empty values stay last. `[uiCellOf]` types `let-invoice` in strict templates.',
    },
    {
      title: 'Selection with bulk actions',
      component: TableSelectionExample,
      file: 'table-selection.example.ts',
      description:
        '`selectionMode="multiple"` adds checkboxes; `selection` is a two-way array of row keys. **Shift+click** (or **Shift+Space**) selects a range from the last clicked row; the header checkbox turns indeterminate for a partial selection.',
    },
    {
      title: '10 000 rows: virtual scroll, sticky header, resizable columns',
      component: TableVirtualExample,
      file: 'table-virtual.example.ts',
      description:
        '`virtual` renders only the rows in view (CDK virtual scroll) at the height of the `--ui-row-height` density token: switch to **Compact** in the header and the rows follow. Sorting still covers all 10 000 rows. Drag a column edge or focus a header and press **Tab** to reach its resize handle, then use the arrow keys.',
    },
    {
      title: 'Custom cell and header templates',
      component: TableTemplatesExample,
      file: 'table-templates.example.ts',
      description:
        'Status pills, links and a header suffix via `uiCell` / `uiHeaderCell` templates. The Status column sorts by severity with a custom `compare` function.',
    },
    {
      title: 'Server-side sorting',
      component: TableServerExample,
      file: 'table-server.example.ts',
      description:
        'With `sortMode="server"` the table only emits `sortChange`; the example fetches sorted rows with a 700 ms delay. `loading` sets `aria-busy`, shows skeleton rows on first load and dims stale rows afterwards.',
    },
  ],
  keyboard: [
    {
      keys: 'Tab',
      action:
        "Moves focus into the grid (to the last active cell) and out of it. From a focused column header, **Tab** reaches that column's resize handle.",
    },
    {
      keys: 'ArrowRight / ArrowLeft',
      action:
        'Moves to the next / previous cell in the row (mirrored in RTL). On a resize handle: widens / narrows the column by 10 px.',
    },
    {
      keys: 'Shift + ArrowRight / Shift + ArrowLeft',
      action: 'On a resize handle: resizes by 50 px.',
    },
    {
      keys: 'ArrowDown / ArrowUp',
      action: 'Moves to the cell below / above, between the header row and data rows.',
    },
    { keys: 'Home / End', action: 'Moves to the first / last cell of the row.' },
    {
      keys: 'Ctrl + Home / Ctrl + End',
      action:
        'Moves to the first cell of the header / the last cell of the last row, scrolling virtualised rows into view.',
    },
    { keys: 'PageDown / PageUp', action: 'Moves down / up by one visible page of rows.' },
    {
      keys: 'Enter / Space',
      action: 'On a sortable header: cycles the sort. On a checkbox: toggles the row or all rows.',
    },
    {
      keys: 'Shift + Space',
      action: 'On a row checkbox: extends the selection from the last toggled row.',
    },
  ],
  a11y: [
    'Implements the WAI-ARIA APG **data grid** pattern (`role="grid"`, `row`, `columnheader`, `gridcell`) rather than a static `role="table"`: with thousands of virtualised rows, arrow-key and PageUp/PageDown navigation is the only practical way to move through data by keyboard, and it keeps the whole grid a single tab stop.',
    'Roving tabindex: exactly one element is tabbable — the active cell, or the single widget inside it (sort button, checkbox, link). Other widgets inside cells get `tabindex="-1"`. Cells with **several** interactive elements are not supported (APG\'s Enter/F2 "interaction mode" is not implemented); keep one widget per cell.',
    'Virtual scrolling: the grid sets `aria-rowcount` to the full row count (header included) and every rendered row carries its real `aria-rowindex`, so screen readers announce "row 5 002 of 10 001". Moving focus to a row that is not rendered scrolls it in first. If the active row is scrolled far away with the mouse, the grid element itself becomes the tab stop and returns focus to that row.',
    'Sorting: the sort control is a native `<button>` inside the `columnheader`; only the sorted column carries `aria-sort` (APG sortable table). Sort changes are not announced separately — add a live region if the order change matters (see the server example).',
    'Selection: the grid gets `aria-multiselectable="true"` and rows `aria-selected`; checkboxes are labelled "Select all rows" and "Select row <value of the first column or `primaryColumn`>". Clicking a row does not select it — selection is always an explicit checkbox action.',
    'Column resize handles are focusable `role="separator"` elements with `aria-orientation="vertical"`, `aria-valuenow/min/max` and a name like "Resize Status column"; they are reachable by **Tab** only from their own header cell, so they never flood the tab order.',
    'Loading sets `aria-busy="true"`; skeleton rows are `aria-hidden`. The empty state is a row with one cell spanning all columns (`aria-colspan`).',
    'Not supported: cell editing, column reordering or hiding, row expansion, multi-column sort, and typeahead. Virtual mode needs a fixed row height (text is truncated with an ellipsis); use non-virtual mode when cells must wrap.',
  ],
});
