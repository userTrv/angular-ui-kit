/*
 * Pure helpers for the table's selection model. The model is an immutable array of row keys (easy to
 * bind, serialise and compare in signals); lookups go through a Set built once per change.
 */

/** Identifies a row across sorting and data reloads (see `UiTable.rowKey`). */
export type UiRowKey = string | number;

/** How a row's key is derived: a property name of the row or a function. */
export type UiRowKeyAccessor<T> = (keyof T & string) | ((row: T) => UiRowKey);

/** The key of `row`: from the accessor, or the row's index in the data when there is none. */
export function resolveRowKey<T>(row: T, index: number, accessor?: UiRowKeyAccessor<T>): UiRowKey {
  if (accessor === undefined) return index;
  return typeof accessor === 'function' ? accessor(row) : (row[accessor] as UiRowKey);
}

/** State of the "select all" checkbox. `some` renders as indeterminate. */
export type UiSelectAllState = 'all' | 'some' | 'none';

/** Adds (`selected = true`) or removes `keys` from `selection`, keeping the order of existing keys. */
export function setKeys<K>(selection: readonly K[], keys: readonly K[], selected: boolean): K[] {
  if (selected) {
    const present = new Set(selection);
    return [...selection, ...keys.filter((k) => !present.has(k))];
  }
  const removed = new Set(keys);
  return selection.filter((k) => !removed.has(k));
}

/** Toggles a single key. */
export function toggleKey<K>(selection: readonly K[], key: K): K[] {
  return setKeys(selection, [key], !selection.includes(key));
}

/**
 * Keys from `anchor` to `target` inclusive, in display order (either direction). When the anchor is
 * no longer displayed (filtered out or reloaded), the range degrades to the target alone.
 */
export function rangeBetween<K>(ordered: readonly K[], anchor: K, target: K): K[] {
  const from = ordered.indexOf(anchor);
  const to = ordered.indexOf(target);
  if (to < 0) return [];
  if (from < 0) return [target];
  return ordered.slice(Math.min(from, to), Math.max(from, to) + 1);
}

/** Whether all, some or none of `keys` are selected. An empty table is `none`. */
export function selectAllState<K>(keys: readonly K[], selected: ReadonlySet<K>): UiSelectAllState {
  if (keys.length === 0 || selected.size === 0) return 'none';
  let count = 0;
  for (const key of keys) if (selected.has(key)) count++;
  return count === 0 ? 'none' : count === keys.length ? 'all' : 'some';
}
