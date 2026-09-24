import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import type { UiColumn } from './column';
import { UiGridCell } from './grid';
import { UiColumnResize } from './resize-handle';
import { UiTableContext } from './table-context';

/**
 * The header row of `ui-table`: select-all checkbox, sort buttons with `aria-sort`, resize handles.
 * @internal
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- renders the cells of a role="row" element owned by the grid
  selector: '[uiTableHeaderRow]',
  imports: [NgTemplateOutlet, UiGridCell, UiColumnResize],
  template: `
    @if (table.selectable()) {
      <div
        role="columnheader"
        class="ui-table__cell ui-table__cell--select"
        [class.ui-table__cell--sticky]="table.stickyFirstColumn()"
        uiGridCell
        [uiGridCellRow]="0"
        [uiGridCellCol]="0"
      >
        <input
          type="checkbox"
          class="ui-table__checkbox"
          aria-label="Select all rows"
          [checked]="table.selectAllState() === 'all'"
          [indeterminate]="table.selectAllState() === 'some'"
          [disabled]="table.rowCount() === 0"
          (change)="table.toggleAll()"
        />
      </div>
    }
    @for (col of table.columns(); track col.key(); let c = $index) {
      <div
        role="columnheader"
        class="ui-table__cell ui-table__cell--header"
        [class.ui-table__cell--end]="col.align() === 'end'"
        [class.ui-table__cell--sticky]="c === 0 && table.stickyFirstColumn()"
        [class.ui-table__cell--sticky-offset]="c === 0 && table.selectable()"
        [attr.aria-sort]="ariaSort(col)"
        uiGridCell
        #cell="uiGridCell"
        [uiGridCellRow]="0"
        [uiGridCellCol]="c + table.colOffset()"
      >
        @if (col.sortable()) {
          <button
            type="button"
            class="ui-table__sort"
            [attr.data-direction]="table.sortDirection(col)"
            (click)="table.toggleSort(col)"
          >
            <ng-container *ngTemplateOutlet="label; context: { $implicit: col }" />
            <svg
              class="ui-table__sort-icon"
              viewBox="0 0 16 16"
              aria-hidden="true"
              focusable="false"
            >
              <path class="ui-table__sort-asc" d="M8 2.5 11.5 7h-7z" />
              <path class="ui-table__sort-desc" d="M8 13.5 4.5 9h7z" />
            </svg>
          </button>
        } @else {
          <ng-container *ngTemplateOutlet="label; context: { $implicit: col }" />
        }
        @if (table.isResizable(col)) {
          <span
            class="ui-table__resize"
            data-ui-grid-skip
            [attr.aria-label]="'Resize ' + col.headerText() + ' column'"
            [attr.tabindex]="cell.isActive() ? 0 : -1"
            [uiColumnResize]="table.columnWidth(col)"
            [uiColumnResizeMin]="col.minWidth()"
            [uiColumnResizeMax]="col.maxWidth()"
            (uiColumnResizeChange)="table.resizeColumn(col, $event)"
          ></span>
        }
      </div>
    }

    <ng-template #label let-col>
      @if (asColumn(col).headerDef(); as def) {
        <ng-container
          *ngTemplateOutlet="
            def.template;
            context: { $implicit: asColumn(col).headerText(), key: asColumn(col).key() }
          "
        />
      } @else {
        <span class="ui-table__text">{{ asColumn(col).headerText() }}</span>
      }
    </ng-template>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'row', class: 'ui-table__row ui-table__row--header', 'aria-rowindex': '1' },
})
export class UiTableHeaderRow {
  protected readonly table = inject(UiTableContext);

  /** APG sortable table: only the sorted column carries `aria-sort`. */
  protected ariaSort(column: UiColumn): 'ascending' | 'descending' | null {
    const direction = this.table.sortDirection(column);
    return direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : null;
  }

  /** Narrows the untyped `let-col` of the local label template. */
  protected asColumn(col: UiColumn): UiColumn {
    return col;
  }
}
