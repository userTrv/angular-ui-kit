/*
 * @usertrv/ui/table — data table (WAI-ARIA data grid) with sorting, selection, column resizing and
 * virtual scrolling. `UiGrid`/`UiGridCell` and `UiColumnResize` are the headless layers underneath.
 */
import { UiCellDef, UiColumn, UiHeaderCellDef, UiTableEmpty } from './column';
import { UiTable } from './table';

export { UiTable, type UiSelectionMode, type UiColumnWidths } from './table';
export {
  UiColumn,
  UiCellDef,
  UiHeaderCellDef,
  UiTableEmpty,
  type UiCellContext,
  type UiHeaderCellContext,
  type UiColumnAlign,
} from './column';
export { UiColumnResize } from './resize-handle';
export { UiGrid, UiGridCell } from './grid';
export { moveGridPosition, type UiGridPosition, type UiGridBounds } from './grid-nav';
export { type UiRowKey, type UiRowKeyAccessor } from './selection';
export {
  nextSort,
  sortBy,
  compareValues,
  createCollator,
  type UiSort,
  type UiSortDirection,
  type UiSortMode,
  type UiSortByOptions,
} from './sort';

/** Everything needed in a template: `imports: [UiTableImports]`. */
export const UiTableImports = [
  UiTable,
  UiColumn,
  UiCellDef,
  UiHeaderCellDef,
  UiTableEmpty,
] as const;
