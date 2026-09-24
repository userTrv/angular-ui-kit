/** One slot in a pagination bar: a 1-based page number or a gap. */
export type UiPaginationItem = number | 'start-ellipsis' | 'end-ellipsis';

/** Options for {@link paginationRange}. */
export interface UiPaginationRangeOptions {
  /** Current page, 1-based. Clamped to `1..pageCount`. */
  page: number;
  /** Total number of pages (at least 1). */
  pageCount: number;
  /** Pages shown on each side of the current page. */
  siblingCount?: number;
  /** Pages always shown at the start and at the end. */
  boundaryCount?: number;
}

function range(start: number, end: number): number[] {
  return end < start ? [] : Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * Computes which page buttons to show, e.g. `[1, 'start-ellipsis', 9, 10, 11, 'end-ellipsis', 62]`.
 * Pure and framework-free. The number of slots stays constant while the current page moves (as
 * long as there are enough pages), so the buttons do not jump under the pointer. An ellipsis never
 * replaces a single page: `1 … 3` is rendered as `1 2 3`.
 */
export function paginationRange(options: UiPaginationRangeOptions): UiPaginationItem[] {
  const count = Math.max(1, Math.floor(options.pageCount));
  const siblings = Math.max(0, Math.floor(options.siblingCount ?? 1));
  const boundary = Math.max(0, Math.floor(options.boundaryCount ?? 1));
  const page = Math.min(Math.max(1, Math.floor(options.page)), count);

  // Everything fits: boundaries + siblings + current + two ellipsis slots.
  if (count <= 2 * boundary + 2 * siblings + 3) return range(1, count);

  const startPages = range(1, boundary);
  const endPages = range(count - boundary + 1, count);

  // Window of siblings around the current page, shifted inwards near the edges so the total
  // number of slots stays the same.
  const siblingsStart = Math.max(
    Math.min(page - siblings, count - boundary - 2 * siblings - 1),
    boundary + 2,
  );
  const siblingsEnd = Math.min(Math.max(page + siblings, boundary + 2 * siblings + 2), count - boundary - 1);

  const items: UiPaginationItem[] = [...startPages];
  // A gap of exactly one page shows that page instead of an ellipsis.
  if (siblingsStart > boundary + 2) items.push('start-ellipsis');
  else if (boundary + 1 < siblingsStart) items.push(boundary + 1);
  items.push(...range(siblingsStart, siblingsEnd));
  if (siblingsEnd < count - boundary - 1) items.push('end-ellipsis');
  else if (count - boundary > siblingsEnd) items.push(count - boundary);
  items.push(...endPages);
  return items;
}
