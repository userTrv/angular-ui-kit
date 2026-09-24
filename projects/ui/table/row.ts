import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import { UiGridCell } from './grid';
import { UiTableContext, UiTableEntry } from './table-context';

/**
 * One body row of `ui-table`: optional selection checkbox and one cell per column.
 * @internal
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- renders the cells of a role="row" element owned by the grid
  selector: '[uiTableRow]',
  imports: [NgTemplateOutlet, UiGridCell],
  template: `
    @if (table.selectable()) {
      <div
        role="gridcell"
        class="ui-table__cell ui-table__cell--select"
        [class.ui-table__cell--sticky]="table.stickyFirstColumn()"
        uiGridCell
        [uiGridCellRow]="gridRow()"
        [uiGridCellCol]="0"
      >
        <input
          type="checkbox"
          class="ui-table__checkbox"
          [checked]="selected()"
          [attr.aria-label]="'Select row ' + table.rowLabel(entry().row)"
          (mousedown)="$event.shiftKey && $event.preventDefault()"
          (click)="onCheckboxClick($event)"
          (keydown.shift.space)="onShiftSpace($event)"
        />
      </div>
    }
    @for (col of table.columns(); track col.key(); let c = $index) {
      <div
        role="gridcell"
        class="ui-table__cell"
        [class.ui-table__cell--end]="col.align() === 'end'"
        [class.ui-table__cell--sticky]="c === 0 && table.stickyFirstColumn()"
        [class.ui-table__cell--sticky-offset]="c === 0 && table.selectable()"
        uiGridCell
        [uiGridCellRow]="gridRow()"
        [uiGridCellCol]="c + table.colOffset()"
      >
        @if (col.cellDef(); as def) {
          <ng-container
            *ngTemplateOutlet="
              def.template;
              context: {
                $implicit: entry().row,
                row: entry().row,
                value: col.valueOf(entry().row),
                index: index(),
              }
            "
          />
        } @else {
          <span class="ui-table__text">{{ table.displayValue(entry().row, col) }}</span>
        }
      </div>
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'row',
    class: 'ui-table__row ui-table__row--body',
    '[class.ui-table__row--odd]': 'index() % 2 === 1',
    '[class.ui-table__row--selected]': 'selected()',
    '[attr.aria-rowindex]': 'gridRow() + 1',
    '[attr.aria-selected]': 'table.selectable() ? selected() : null',
  },
})
export class UiTableRow {
  /** The row and its key. */
  readonly entry = input.required<UiTableEntry<unknown>>();
  /** Position in the displayed (sorted) rows, 0-based. */
  readonly index = input.required({ transform: numberAttribute });

  protected readonly table = inject(UiTableContext);
  /** Grid row: the header row is 0. */
  protected readonly gridRow = computed(() => this.index() + 1);
  protected readonly selected = computed(() => this.table.isSelected(this.entry().key));

  protected onCheckboxClick(event: MouseEvent): void {
    const checkbox = event.target as HTMLInputElement;
    this.table.selectRow(this.entry().key, checkbox.checked, event.shiftKey);
  }

  /** Shift+Space extends the selection from the anchor row, like Shift+click. */
  protected onShiftSpace(event: Event): void {
    event.preventDefault();
    this.table.selectRow(this.entry().key, !this.selected(), true);
  }
}
