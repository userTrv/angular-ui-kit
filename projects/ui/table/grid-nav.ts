/** A cell position in a grid: row 0 is the header row, data rows start at 1. */
export interface UiGridPosition {
  readonly row: number;
  readonly col: number;
}

/** Size of the grid and page step used by {@link moveGridPosition}. */
export interface UiGridBounds {
  readonly rows: number;
  readonly cols: number;
  /** Rows moved by PageUp / PageDown. */
  readonly pageSize: number;
  /** Swaps ArrowLeft / ArrowRight in right-to-left layouts. */
  readonly rtl?: boolean;
}

const clamp = (value: number, max: number) => Math.max(0, Math.min(value, max));

/**
 * Where focus goes for a key press in a WAI-ARIA data grid, or `null` when the key is not a grid
 * navigation key. Movement stops at the edges (no wrapping), as recommended by the APG grid pattern.
 */
export function moveGridPosition(
  pos: UiGridPosition,
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey'>,
  bounds: UiGridBounds,
): UiGridPosition | null {
  const lastRow = Math.max(0, bounds.rows - 1);
  const lastCol = Math.max(0, bounds.cols - 1);
  const ctrl = event.ctrlKey || event.metaKey;
  const forward = bounds.rtl ? -1 : 1;
  const page = Math.max(1, bounds.pageSize);
  let { row, col } = pos;

  switch (event.key) {
    case 'ArrowDown':
      row += 1;
      break;
    case 'ArrowUp':
      row -= 1;
      break;
    case 'ArrowRight':
      col += forward;
      break;
    case 'ArrowLeft':
      col -= forward;
      break;
    case 'PageDown':
      row += page;
      break;
    case 'PageUp':
      row -= page;
      break;
    case 'Home':
      col = 0;
      if (ctrl) row = 0;
      break;
    case 'End':
      col = lastCol;
      if (ctrl) row = lastRow;
      break;
    default:
      return null;
  }
  return { row: clamp(row, lastRow), col: clamp(col, lastCol) };
}
