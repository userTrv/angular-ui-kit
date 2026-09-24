import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  booleanAttribute,
  contentChild,
  inject,
  input,
  numberAttribute,
} from '@angular/core';

/** Context of a `uiCell` template. */
export interface UiCellContext<T> {
  /** The row (`let-row`). */
  $implicit: T;
  /** The row, for `let-row="row"`. */
  row: T;
  /** The column's value for this row (`value` accessor or `row[key]`). */
  value: unknown;
  /** Position of the row in the displayed (sorted) order. */
  index: number;
}

/** Context of a `uiHeaderCell` template. */
export interface UiHeaderCellContext {
  /** The column's header text. */
  $implicit: string;
  /** The column key. */
  key: string;
}

/**
 * Custom cell template for a `ui-column`: `<ng-template uiCell let-row>`. Bind the table data to
 * `[uiCellOf]` to type `row` in strict templates: `<ng-template uiCell [uiCellOf]="invoices" let-row>`.
 */
@Directive({ selector: 'ng-template[uiCell]' })
export class UiCellDef<T> {
  /** @internal */
  readonly template = inject<TemplateRef<UiCellContext<T>>>(TemplateRef);
  /** The table's rows. Used only to infer the row type of the template context; never read. */
  readonly of = input<readonly T[]>([], { alias: 'uiCellOf' });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature required by the Angular compiler
  static ngTemplateContextGuard<T>(_dir: UiCellDef<T>, ctx: unknown): ctx is UiCellContext<T> {
    return true;
  }
}

/** Custom header content for a `ui-column`: `<ng-template uiHeaderCell let-header>`. */
@Directive({ selector: 'ng-template[uiHeaderCell]' })
export class UiHeaderCellDef {
  /** @internal */
  readonly template = inject<TemplateRef<UiHeaderCellContext>>(TemplateRef);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature required by the Angular compiler
  static ngTemplateContextGuard(_dir: UiHeaderCellDef, ctx: unknown): ctx is UiHeaderCellContext {
    return true;
  }
}

/** Content shown when the table has no rows: `<ng-template uiTableEmpty>No invoices yet</ng-template>`. */
@Directive({ selector: 'ng-template[uiTableEmpty]' })
export class UiTableEmpty {
  /** @internal */
  readonly template = inject<TemplateRef<void>>(TemplateRef);
}

/** Horizontal alignment of a column's cells. Use `end` for numbers and amounts. */
export type UiColumnAlign = 'start' | 'end';

/** Width used when a column declares none. */
export const UI_COLUMN_DEFAULT_WIDTH = 160;

const optionalNumber = (v: unknown) =>
  v === undefined || v === null || v === '' ? undefined : numberAttribute(v);
const optionalBoolean = (v: unknown) =>
  v === undefined || v === null ? undefined : booleanAttribute(v);

/**
 * Declares one column of a `ui-table`. Renders nothing itself; the table reads its inputs and
 * templates. Cells show `row[key]` unless `value` or a `uiCell` template is given.
 *
 * `T` is inferred from the `value` / `compare` functions you bind, so they are checked against your row type.
 */
@Component({
  selector: 'ui-column',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiColumn<T = unknown> {
  /** Unique column key. Also the property read from each row when no `value` is given, and the `sort` key. */
  readonly key = input.required<string>();
  /** Header text (also the accessible name of the column header). Defaults to `key`. */
  readonly header = input('');
  /** Makes the header a sort button. */
  readonly sortable = input(false, { transform: booleanAttribute });
  /** Initial width in px (default 160). The table's `columnWidths` model overrides it after a resize. */
  readonly width = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  /** Smallest width a resize can produce, in px. */
  readonly minWidth = input(64, { transform: numberAttribute });
  /** Largest width a resize can produce, in px. */
  readonly maxWidth = input(1200, { transform: numberAttribute });
  /** Per-column override of the table's `resizable`. */
  readonly resizable = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBoolean,
  });
  /** Cell alignment. */
  readonly align = input<UiColumnAlign>('start');
  /** Reads the cell value from a row (used for display, sorting and the row checkbox label). */
  readonly value = input<(row: T) => unknown>();
  /** Custom ascending comparator for client-side sorting. Replaces the built-in value comparison. */
  readonly compare = input<(a: T, b: T) => number>();

  /** @internal */
  readonly cellDef = contentChild(UiCellDef);
  /** @internal */
  readonly headerDef = contentChild(UiHeaderCellDef);

  /** @internal Value of this column for `row`. */
  valueOf(row: T): unknown {
    const accessor = this.value();
    if (accessor) return accessor(row);
    return typeof row === 'object' && row !== null
      ? (row as Record<string, unknown>)[this.key()]
      : undefined;
  }

  /** @internal */
  headerText(): string {
    return this.header() || this.key();
  }
}

/** Default text for a cell value: empty for null/undefined, localized medium date for dates. */
export function formatCellValue(value: unknown, dateFormat: Intl.DateTimeFormat): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : dateFormat.format(value);
  return String(value);
}
