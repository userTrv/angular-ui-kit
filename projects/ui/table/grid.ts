import { Directionality } from '@angular/cdk/bidi';
import {
  Directive,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  untracked,
} from '@angular/core';
import { UiGridPosition, moveGridPosition } from './grid-nav';

/** Elements that can be a cell's focus target. Opt an element out with `data-ui-grid-skip`. */
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';

const keyOf = (pos: UiGridPosition) => `${pos.row}:${pos.col}`;

function isTextEntry(el: HTMLElement): boolean {
  if (el.isContentEditable || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true;
  if (el.tagName !== 'INPUT') return false;
  return !['checkbox', 'radio', 'button', 'submit', 'reset'].includes(
    (el as HTMLInputElement).type,
  );
}

/**
 * Headless keyboard model of a WAI-ARIA data grid (roving tabindex): exactly one cell — or the single
 * widget inside it — is in the tab order; arrows, Home/End, PageUp/PageDown and Ctrl+Home/End move it.
 *
 * Works with virtualised rows: cells register themselves while rendered. When the target row is not
 * rendered, the grid emits `uiGridRowRequest` (scroll it into the rendered range) and focuses the cell
 * as soon as it registers. While the active cell is not rendered, the grid element itself is the tab stop.
 */
@Directive({
  selector: '[uiGrid]',
  exportAs: 'uiGrid',
  host: {
    '[attr.tabindex]': 'activeRendered() ? null : 0',
    '(keydown)': 'onKeydown($event)',
    '(focus)': 'focusCell(active())',
  },
})
export class UiGrid {
  /** Total number of rows, including the header row and rows that are not rendered. */
  readonly rowCount = input.required({ alias: 'uiGridRowCount', transform: numberAttribute });
  /** Number of columns. */
  readonly colCount = input.required({ alias: 'uiGridColCount', transform: numberAttribute });
  /** Rows moved by PageUp / PageDown. */
  readonly pageSize = input(10, { alias: 'uiGridPageSize', transform: numberAttribute });
  /** Emits a row index that must be rendered before its cell can take focus. */
  readonly rowRequest = output<number>({ alias: 'uiGridRowRequest' });

  private readonly dir = inject(Directionality, { optional: true });
  private readonly cells = new Map<string, UiGridCell>();
  private readonly registryVersion = signal(0);
  private readonly position = signal<UiGridPosition>({ row: 0, col: 0 });
  private pendingFocus: string | null = null;

  /** The active cell, clamped to the current grid size. */
  readonly active = computed<UiGridPosition>(() => {
    const { row, col } = this.position();
    return {
      row: Math.max(0, Math.min(row, this.rowCount() - 1)),
      col: Math.max(0, Math.min(col, this.colCount() - 1)),
    };
  });

  protected readonly activeRendered = computed(() => {
    this.registryVersion();
    return this.cells.has(keyOf(this.active()));
  });

  /** Makes `pos` the tab stop without moving focus. */
  setActive(pos: UiGridPosition): void {
    const current = untracked(this.position);
    if (current.row !== pos.row || current.col !== pos.col) this.position.set(pos);
  }

  /** Makes `pos` active and focuses it, requesting its row first if it is not rendered. */
  focusCell(pos: UiGridPosition): void {
    this.setActive(pos);
    const target = untracked(this.active);
    const key = keyOf(target);
    const cell = this.cells.get(key);
    if (cell) {
      this.pendingFocus = null;
      cell.focus();
    } else {
      this.pendingFocus = key;
      this.rowRequest.emit(target.row);
    }
  }

  /** @internal */
  register(pos: UiGridPosition, cell: UiGridCell): void {
    const key = keyOf(pos);
    this.cells.set(key, cell);
    if (key === keyOf(untracked(this.active))) this.registryVersion.update((v) => v + 1);
    if (this.pendingFocus === key) {
      this.pendingFocus = null;
      cell.focus();
    }
  }

  /** @internal */
  unregister(pos: UiGridPosition, cell: UiGridCell): void {
    const key = keyOf(pos);
    if (this.cells.get(key) !== cell) return;
    this.cells.delete(key);
    if (key === keyOf(untracked(this.active))) this.registryVersion.update((v) => v + 1);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.altKey || isTextEntry(event.target as HTMLElement)) return;
    const next = moveGridPosition(this.active(), event, {
      rows: this.rowCount(),
      cols: this.colCount(),
      pageSize: this.pageSize(),
      rtl: this.dir?.value === 'rtl',
    });
    if (!next) return;
    event.preventDefault();
    this.focusCell(next);
  }
}

/**
 * A cell of a `uiGrid`. Its focus target is the first focusable descendant (a sort button, a
 * checkbox, a link in a custom template) or, if there is none, the cell itself. The directive keeps
 * exactly the active cell's target at `tabindex="0"` and every other focusable in the cell at `-1`.
 */
@Directive({
  selector: '[uiGridCell]',
  exportAs: 'uiGridCell',
  host: {
    '[attr.aria-colindex]': 'col() + 1',
    '(focusin)': 'grid.setActive({ row: row(), col: col() })',
  },
})
export class UiGridCell {
  /** Row index in the grid (0 = header row). */
  readonly row = input.required({ alias: 'uiGridCellRow', transform: numberAttribute });
  /** Column index in the grid. */
  readonly col = input.required({ alias: 'uiGridCellCol', transform: numberAttribute });

  protected readonly grid = inject(UiGrid);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Whether this cell is the grid's tab stop. */
  readonly isActive = computed(() => {
    const active = this.grid.active();
    return active.row === this.row() && active.col === this.col();
  });

  constructor() {
    // Tabindex first: a cell registering with a pending focus request must already be focusable.
    afterRenderEffect(() => this.syncTabIndex(this.isActive()));
    afterRenderEffect((onCleanup) => {
      const pos = { row: this.row(), col: this.col() };
      this.grid.register(pos, this);
      onCleanup(() => this.grid.unregister(pos, this));
    });
  }

  /** Moves focus to the cell's focus target. */
  focus(): void {
    (this.targets()[0] ?? this.host).focus();
  }

  private targets(): HTMLElement[] {
    return Array.from(this.host.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.hasAttribute('data-ui-grid-skip') && !(el as HTMLInputElement).disabled,
    );
  }

  private syncTabIndex(active: boolean): void {
    const [first, ...rest] = this.targets();
    for (const el of rest) el.tabIndex = -1;
    if (first) {
      first.tabIndex = active ? 0 : -1;
      this.host.removeAttribute('tabindex');
    } else {
      this.host.tabIndex = active ? 0 : -1;
    }
  }
}
