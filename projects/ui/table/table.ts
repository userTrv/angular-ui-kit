import { NgTemplateOutlet } from '@angular/common';
import { ListRange } from '@angular/cdk/collections';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
  CdkVirtualScrollableElement,
} from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  LOCALE_ID,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  contentChildren,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { UI_COLUMN_DEFAULT_WIDTH, UiColumn, UiTableEmpty, formatCellValue } from './column';
import { UiGrid } from './grid';
import { UiTableHeaderRow } from './header-row';
import { UiTableRow } from './row';
import { UI_TABLE_FALLBACK_ROW_HEIGHT, trackTableMetrics } from './row-metrics';
import {
  UiRowKey,
  UiRowKeyAccessor,
  UiSelectAllState,
  rangeBetween,
  resolveRowKey,
  selectAllState,
  setKeys,
} from './selection';
import { UiSort, UiSortDirection, UiSortMode, createCollator, nextSort, sortBy } from './sort';
import { UiTableContext, UiTableEntry } from './table-context';

/** `none` hides the checkbox column; `multiple` adds row checkboxes and a select-all checkbox. */
export type UiSelectionMode = 'none' | 'multiple';

/** Column widths in px by column key. */
export type UiColumnWidths = Readonly<Record<string, number>>;

/** Width of the selection checkbox column in px. */
const SELECT_COLUMN_WIDTH = 44;

/**
 * Data table rendered as a WAI-ARIA **data grid** (`role="grid"`): declarative `ui-column`s, client or
 * server sorting, checkbox selection with Shift range, sticky header and first column, keyboard and
 * pointer column resizing, and optional virtual scrolling (CDK) for tens of thousands of rows.
 *
 * Columns share one CSS grid template (`--_columns`), so the sticky header and the virtualised rows
 * stay aligned while scrolling and resizing.
 */
@Component({
  selector: 'ui-table',
  exportAs: 'uiTable',
  imports: [
    NgTemplateOutlet,
    CdkVirtualScrollableElement,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    UiGrid,
    UiTableHeaderRow,
    UiTableRow,
  ],
  templateUrl: './table.html',
  styleUrl: './table.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: UiTableContext, useExisting: UiTable }],
  host: {
    class: 'ui-table',
    '[class.ui-table--virtual]': 'virtual()',
    '[class.ui-table--striped]': 'striped()',
    '[class.ui-table--sticky-header]': 'stickyHeader()',
    '[class.ui-table--loading]': 'loading()',
    '[style.--_columns]': 'gridTemplate()',
    '[style.--_min-width.px]': 'minGridWidth()',
    '[style.--_row-h.px]': 'virtual() ? rowHeightPx() : null',
    '[style.--_select-w.px]': 'selectColumnWidth',
  },
})
export class UiTable<T> extends UiTableContext {
  /** The rows. Treated as immutable: pass a new array to update. */
  readonly data = input.required<readonly T[]>();
  /** Stable row identity for selection, focus and DOM reuse. Defaults to the index in `data` (fragile when data changes). */
  readonly rowKey = input<UiRowKeyAccessor<T>>();
  /** Accessible name of the grid (use this or `labelledBy`). */
  readonly label = input<string>();
  /** Id of the element that labels the grid, e.g. a heading above it. */
  readonly labelledBy = input<string>();
  /** Current sort; `null` means data order. Two-way bindable. */
  readonly sort = model<UiSort | null>(null);
  /** `server` only updates `sort`; the consumer loads rows in that order. */
  readonly sortMode = input<UiSortMode>('client');
  /** Locale for string comparison and date formatting. Defaults to `LOCALE_ID`. */
  readonly locale = input<string>();
  /** Adds the checkbox column. */
  readonly selectionMode = input<UiSelectionMode>('none');
  /** Keys of the selected rows. Two-way bindable. Keys not present in `data` are preserved. */
  readonly selection = model<readonly UiRowKey[]>([]);
  /** Enables resize handles on every column (a column's own `resizable` wins). */
  readonly resizable = input(false, { transform: booleanAttribute });
  /** Column widths in px by key, set by resizing. Two-way bindable (persist it to restore a layout). */
  readonly columnWidths = model<UiColumnWidths>({});
  /** Renders only the rows in view (CDK virtual scroll). Rows get a fixed height and the table needs a height. */
  readonly virtual = input(false, { transform: booleanAttribute });
  /** Fixed row height in px for virtual scrolling. Defaults to the measured `--ui-row-height` density token. */
  readonly rowHeight = input<number | undefined, unknown>(undefined, {
    transform: (v: unknown) =>
      v === undefined || v === null || v === '' ? undefined : numberAttribute(v),
  });
  /** Keeps the header visible while scrolling. */
  readonly stickyHeader = input(true, { transform: booleanAttribute });
  /** Keeps the first column (and the selection column) visible while scrolling horizontally. */
  override readonly stickyFirstColumn = input(false, { transform: booleanAttribute });
  /** Zebra striping. */
  readonly striped = input(false, { transform: booleanAttribute });
  /** Marks the grid busy; shows skeleton rows while there is no data yet, dims existing rows otherwise. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Key of the column that names a row in the row checkbox label ("Select row …"). Defaults to the first column. */
  readonly primaryColumn = input<string>();
  /** Emits the range of rendered row indexes while virtual scrolling. */
  readonly renderedRangeChange = output<ListRange>();

  /** @internal */
  override readonly columns = contentChildren(UiColumn);
  protected readonly emptyDef = contentChild(UiTableEmpty);
  protected readonly viewport = viewChild(CdkVirtualScrollViewport);
  private readonly probe = viewChild<ElementRef<HTMLElement>>('probe');
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  private readonly metrics = trackTableMetrics(this.probe, this.scroller, this.viewport);
  private readonly defaultLocale = inject(LOCALE_ID);
  private anchor: UiRowKey | null = null;

  protected readonly selectColumnWidth = SELECT_COLUMN_WIDTH;
  protected readonly skeletonRows = [0, 1, 2, 3, 4];

  private readonly collator = computed(() => createCollator(this.locale() ?? this.defaultLocale));
  private readonly dateFormat = computed(
    () => new Intl.DateTimeFormat(this.locale() ?? this.defaultLocale, { dateStyle: 'medium' }),
  );

  private readonly entries = computed<UiTableEntry<T>[]>(() => {
    const accessor = this.rowKey();
    return this.data().map((row, index) => ({ row, key: resolveRowKey(row, index, accessor) }));
  });
  private readonly allKeys = computed(() => this.entries().map((e) => e.key));

  /** @internal Rows in display order. */
  readonly viewRows = computed<readonly UiTableEntry<T>[]>(() => {
    const entries = this.entries();
    const sort = this.sort();
    if (!sort || this.sortMode() === 'server') return entries;
    const column = this.columns().find((c) => c.key() === sort.key);
    if (!column) return entries;
    const compare = column.compare();
    return sortBy(entries, (e) => column.valueOf(e.row), sort.direction, {
      collator: this.collator(),
      compare: compare && ((a, b) => compare(a.row, b.row)),
    });
  });

  private readonly selectedKeys = computed(() => new Set(this.selection()));
  /** @internal */
  override readonly selectable = computed(() => this.selectionMode() === 'multiple');
  /** @internal */
  override readonly colOffset = computed(() => (this.selectable() ? 1 : 0));
  /** @internal */
  override readonly rowCount = computed(() => this.viewRows().length);
  /** @internal */
  override readonly selectAllState = computed<UiSelectAllState>(() =>
    selectAllState(this.allKeys(), this.selectedKeys()),
  );

  protected readonly colCount = computed(() => this.columns().length + this.colOffset());
  protected readonly showEmpty = computed(() => !this.loading() && this.viewRows().length === 0);
  /** Header row + data rows (+ the empty-state row). Tells AT the real size of a virtualised grid. */
  protected readonly ariaRowCount = computed(
    () => this.viewRows().length + 1 + (this.showEmpty() ? 1 : 0),
  );
  protected readonly rowHeightPx = computed(
    () => this.rowHeight() ?? this.metrics.rowHeight() ?? UI_TABLE_FALLBACK_ROW_HEIGHT,
  );
  protected readonly pageSize = computed(() => {
    const rows = Math.floor(this.metrics.viewportHeight() / this.rowHeightPx()) - 1;
    return rows > 0 ? rows : 10;
  });

  protected readonly gridTemplate = computed(() => {
    const tracks = this.columns().map((c) => `${this.columnWidth(c)}px`);
    if (this.selectable()) tracks.unshift(`${SELECT_COLUMN_WIDTH}px`);
    return [...tracks, 'minmax(0, 1fr)'].join(' ');
  });
  protected readonly minGridWidth = computed(
    () =>
      this.columns().reduce((sum, c) => sum + this.columnWidth(c), 0) +
      (this.selectable() ? SELECT_COLUMN_WIDTH : 0),
  );

  protected readonly trackEntry = (_: number, entry: UiTableEntry<T>) => entry.key;

  constructor() {
    super();
    effect((onCleanup) => {
      const viewport = this.viewport();
      if (!viewport) return;
      const sub = viewport.renderedRangeStream.subscribe((range) =>
        this.renderedRangeChange.emit(range),
      );
      onCleanup(() => sub.unsubscribe());
    });
  }

  /** @internal */
  override isSelected(key: UiRowKey): boolean {
    return this.selectedKeys().has(key);
  }

  /** @internal */
  override toggleAll(): void {
    const select = this.selectAllState() !== 'all';
    this.selection.update((current) => setKeys(current, this.allKeys(), select));
  }

  /** @internal Sets one row, or the range from the last clicked row (the anchor) to it, to `selected`. */
  override selectRow(key: UiRowKey, selected: boolean, range: boolean): void {
    const keys =
      range && this.anchor !== null
        ? rangeBetween(
            this.viewRows().map((e) => e.key),
            this.anchor,
            key,
          )
        : [key];
    if (!range || this.anchor === null) this.anchor = key;
    this.selection.update((current) => setKeys(current, keys, selected));
  }

  /** @internal */
  override rowLabel(row: unknown): string {
    const columns = this.columns();
    const key = this.primaryColumn();
    const column = (key && columns.find((c) => c.key() === key)) || columns[0];
    return column ? this.displayValue(row, column) : '';
  }

  /** @internal */
  override displayValue(row: unknown, column: UiColumn): string {
    return formatCellValue(column.valueOf(row), this.dateFormat());
  }

  /** @internal */
  override sortDirection(column: UiColumn): UiSortDirection | null {
    const sort = this.sort();
    return sort?.key === column.key() ? sort.direction : null;
  }

  /** @internal */
  override toggleSort(column: UiColumn): void {
    this.sort.set(nextSort(untracked(this.sort), column.key()));
  }

  /** @internal */
  override isResizable(column: UiColumn): boolean {
    return column.resizable() ?? this.resizable();
  }

  /** @internal */
  override columnWidth(column: UiColumn): number {
    const width = this.columnWidths()[column.key()] ?? column.width() ?? UI_COLUMN_DEFAULT_WIDTH;
    return Math.max(column.minWidth(), Math.min(column.maxWidth(), width));
  }

  /** @internal */
  override resizeColumn(column: UiColumn, width: number): void {
    this.columnWidths.update((widths) => ({ ...widths, [column.key()]: width }));
  }

  /** Scrolls the row at `index` (display order) into the rendered range and view. */
  scrollToRow(index: number): void {
    const viewport = this.viewport();
    if (viewport) {
      const { start, end } = viewport.getRenderedRange();
      if (index < start || index >= end) viewport.scrollToIndex(index);
    }
  }

  protected onRowRequest(gridRow: number): void {
    if (gridRow > 0) this.scrollToRow(gridRow - 1);
  }
}
