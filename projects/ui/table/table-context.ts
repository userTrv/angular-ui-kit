import { Signal } from '@angular/core';
import type { UiColumn } from './column';
import type { UiRowKey, UiSelectAllState } from './selection';
import type { UiSortDirection } from './sort';

/** A displayed row: the consumer's row object plus its stable key. */
export interface UiTableEntry<T> {
  readonly row: T;
  readonly key: UiRowKey;
}

/**
 * What the row components need from the table. An abstract class (not the table itself) so the
 * row components do not import `UiTable` and create a circular dependency.
 * @internal
 */
export abstract class UiTableContext {
  abstract readonly columns: Signal<readonly UiColumn[]>;
  abstract readonly selectable: Signal<boolean>;
  /** 1 when the selection column is shown, so data columns start at grid column 1. */
  abstract readonly colOffset: Signal<number>;
  abstract readonly stickyFirstColumn: Signal<boolean>;
  abstract readonly selectAllState: Signal<UiSelectAllState>;
  abstract readonly rowCount: Signal<number>;

  abstract isSelected(key: UiRowKey): boolean;
  abstract toggleAll(): void;
  abstract selectRow(key: UiRowKey, selected: boolean, range: boolean): void;
  abstract rowLabel(row: unknown): string;
  abstract displayValue(row: unknown, column: UiColumn): string;
  abstract sortDirection(column: UiColumn): UiSortDirection | null;
  abstract toggleSort(column: UiColumn): void;
  abstract isResizable(column: UiColumn): boolean;
  abstract columnWidth(column: UiColumn): number;
  abstract resizeColumn(column: UiColumn, width: number): void;
}
