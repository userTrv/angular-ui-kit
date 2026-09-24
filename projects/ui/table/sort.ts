/** Direction of an active sort. "No sort" is represented by a `null` {@link UiSort}. */
export type UiSortDirection = 'asc' | 'desc';

/** The table's sort model: which column key is sorted and in which direction. */
export interface UiSort {
  readonly key: string;
  readonly direction: UiSortDirection;
}

/**
 * `client` sorts `data` inside the table with the built-in comparator; `server` only updates the
 * `sort` model and leaves the order of `data` to the consumer (who fetches sorted rows).
 */
export type UiSortMode = 'client' | 'server';

/**
 * The next state of the sort cycle when the header of column `key` is activated:
 * none → ascending → descending → none. Activating another column starts it at ascending.
 */
export function nextSort(current: UiSort | null, key: string): UiSort | null {
  if (!current || current.key !== key) return { key, direction: 'asc' };
  return current.direction === 'asc' ? { key, direction: 'desc' } : null;
}

/** Locale-aware string collator used by the default comparator (`numeric` so "item 10" sorts after "item 9"). */
export function createCollator(locale?: string): Intl.Collator {
  return new Intl.Collator(locale, { numeric: true });
}

const defaultCollator = createCollator();

/** `null`, `undefined`, `''`, `NaN` and invalid dates count as empty and always sort last. */
export function isEmptySortValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  if (typeof value === 'number') return Number.isNaN(value);
  if (value instanceof Date) return Number.isNaN(value.getTime());
  return false;
}

/**
 * Compares two non-empty cell values in ascending order: numbers and bigints numerically, dates
 * chronologically, booleans `false` before `true`, everything else as strings with `Intl.Collator`.
 */
export function compareValues(
  a: unknown,
  b: unknown,
  collator: Intl.Collator = defaultCollator,
): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'bigint' && typeof b === 'bigint') return a < b ? -1 : a > b ? 1 : 0;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  return collator.compare(String(a), String(b));
}

/** Options for {@link sortBy}. */
export interface UiSortByOptions<T> {
  /** Collator for string comparison; defaults to the runtime locale. */
  collator?: Intl.Collator;
  /** Full custom comparator for ascending order; replaces the value comparison (and the empty-last rule). */
  compare?: (a: T, b: T) => number;
}

/**
 * Returns a sorted copy of `items` (stable). Values are read once per item, so the accessor may be
 * expensive. Empty values (see {@link isEmptySortValue}) stay at the end in both directions.
 */
export function sortBy<T>(
  items: readonly T[],
  value: (item: T) => unknown,
  direction: UiSortDirection,
  options: UiSortByOptions<T> = {},
): T[] {
  const sign = direction === 'asc' ? 1 : -1;
  const { compare, collator = defaultCollator } = options;
  if (compare) return [...items].sort((a, b) => sign * compare(a, b));

  const decorated = items.map((item) => ({ item, value: value(item) }));
  decorated.sort((a, b) => {
    const aEmpty = isEmptySortValue(a.value);
    const bEmpty = isEmptySortValue(b.value);
    if (aEmpty || bEmpty) return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1;
    return sign * compareValues(a.value, b.value, collator);
  });
  return decorated.map((d) => d.item);
}
