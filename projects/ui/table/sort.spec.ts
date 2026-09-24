import { compareValues, createCollator, isEmptySortValue, nextSort, sortBy } from './sort';

describe('nextSort', () => {
  it('cycles asc → desc → none on the same column', () => {
    const asc = nextSort(null, 'name');
    expect(asc).toEqual({ key: 'name', direction: 'asc' });
    const desc = nextSort(asc, 'name');
    expect(desc).toEqual({ key: 'name', direction: 'desc' });
    expect(nextSort(desc, 'name')).toBeNull();
  });

  it('starts another column at ascending', () => {
    expect(nextSort({ key: 'name', direction: 'desc' }, 'amount')).toEqual({
      key: 'amount',
      direction: 'asc',
    });
  });
});

describe('compareValues', () => {
  it('compares numbers numerically, not as strings', () => {
    expect(compareValues(9, 10)).toBeLessThan(0);
    expect(compareValues(-1, -2)).toBeGreaterThan(0);
  });

  it('compares dates chronologically', () => {
    expect(compareValues(new Date('2026-01-02'), new Date('2025-12-31'))).toBeGreaterThan(0);
  });

  it('compares booleans false before true', () => {
    expect(compareValues(false, true)).toBeLessThan(0);
  });

  it('compares strings with numeric collation', () => {
    expect(compareValues('build 9', 'build 10')).toBeLessThan(0);
  });
});

describe('isEmptySortValue', () => {
  it.each([null, undefined, '', Number.NaN, new Date('nope')])('treats %s as empty', (value) => {
    expect(isEmptySortValue(value)).toBe(true);
  });

  it.each([0, false, 'x', new Date(0)])('treats %s as a value', (value) => {
    expect(isEmptySortValue(value)).toBe(false);
  });
});

describe('sortBy', () => {
  const identity = <T>(v: T) => v;

  it('sorts strings with the locale rules of the collator', () => {
    const words = ['zebra', 'äpple', 'apa'];
    expect(sortBy(words, identity, 'asc', { collator: createCollator('de') })).toEqual([
      'apa',
      'äpple',
      'zebra',
    ]);
    expect(sortBy(words, identity, 'asc', { collator: createCollator('sv') })).toEqual([
      'apa',
      'zebra',
      'äpple',
    ]);
  });

  it('sorts numbers and reverses for descending', () => {
    expect(sortBy([3, 20, 1], identity, 'asc')).toEqual([1, 3, 20]);
    expect(sortBy([3, 20, 1], identity, 'desc')).toEqual([20, 3, 1]);
  });

  it('sorts dates', () => {
    const d = (iso: string) => new Date(iso);
    const sorted = sortBy([d('2026-03-01'), d('2024-07-15'), d('2025-01-01')], identity, 'asc');
    expect(sorted.map((x) => x.getFullYear())).toEqual([2024, 2025, 2026]);
  });

  it('keeps empty values last in both directions', () => {
    const values = [2, null, 1, undefined, 3, Number.NaN];
    expect(sortBy(values, identity, 'asc').slice(0, 3)).toEqual([1, 2, 3]);
    expect(sortBy(values, identity, 'desc').slice(0, 3)).toEqual([3, 2, 1]);
    expect(sortBy(values, identity, 'desc').slice(3).every(isEmptySortValue)).toBe(true);
  });

  it('is stable and does not mutate the input', () => {
    const rows = [
      { id: 'a', team: 'web' },
      { id: 'b', team: 'api' },
      { id: 'c', team: 'web' },
      { id: 'd', team: 'api' },
    ];
    const copy = [...rows];
    expect(sortBy(rows, (r) => r.team, 'asc').map((r) => r.id)).toEqual(['b', 'd', 'a', 'c']);
    expect(rows).toEqual(copy);
  });

  it('uses a custom comparator when given', () => {
    const order = ['low', 'medium', 'high'];
    const byPriority = (a: string, b: string) => order.indexOf(a) - order.indexOf(b);
    expect(sortBy(['high', 'low', 'medium'], identity, 'desc', { compare: byPriority })).toEqual([
      'high',
      'medium',
      'low',
    ]);
  });
});
