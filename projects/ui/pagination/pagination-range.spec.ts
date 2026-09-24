import { paginationRange } from './pagination-range';

describe('paginationRange', () => {
  it('returns every page when they fit', () => {
    expect(paginationRange({ page: 1, pageCount: 1 })).toEqual([1]);
    expect(paginationRange({ page: 3, pageCount: 7 })).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('adds an end ellipsis near the start', () => {
    expect(paginationRange({ page: 1, pageCount: 20 })).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 20]);
    expect(paginationRange({ page: 4, pageCount: 20 })).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 20]);
  });

  it('adds a start ellipsis near the end', () => {
    expect(paginationRange({ page: 20, pageCount: 20 })).toEqual([1, 'start-ellipsis', 16, 17, 18, 19, 20]);
    expect(paginationRange({ page: 17, pageCount: 20 })).toEqual([1, 'start-ellipsis', 16, 17, 18, 19, 20]);
  });

  it('shows both ellipses in the middle', () => {
    expect(paginationRange({ page: 10, pageCount: 20 })).toEqual([1, 'start-ellipsis', 9, 10, 11, 'end-ellipsis', 20]);
  });

  it('keeps the number of slots constant while the page moves', () => {
    const lengths = new Set(
      Array.from({ length: 62 }, (_, i) => paginationRange({ page: i + 1, pageCount: 62 }).length),
    );
    expect([...lengths]).toEqual([7]);
  });

  it('never hides a single page behind an ellipsis', () => {
    expect(paginationRange({ page: 5, pageCount: 20 })).toEqual([1, 'start-ellipsis', 4, 5, 6, 'end-ellipsis', 20]);
    for (let page = 1; page <= 30; page++) {
      const items = paginationRange({ page, pageCount: 30, siblingCount: 1, boundaryCount: 1 });
      items.forEach((item, i) => {
        if (typeof item === 'number') return;
        const before = items[i - 1] as number;
        const after = items[i + 1] as number;
        expect(after - before, `gap at page ${page}`).toBeGreaterThan(2);
      });
    }
  });

  it('respects siblingCount and boundaryCount', () => {
    expect(paginationRange({ page: 50, pageCount: 100, siblingCount: 2, boundaryCount: 2 })).toEqual([
      1, 2, 'start-ellipsis', 48, 49, 50, 51, 52, 'end-ellipsis', 99, 100,
    ]);
    expect(paginationRange({ page: 50, pageCount: 100, siblingCount: 0, boundaryCount: 0 })).toEqual([
      'start-ellipsis', 50, 'end-ellipsis',
    ]);
  });

  it('clamps out-of-range input', () => {
    expect(paginationRange({ page: 99, pageCount: 5 })).toEqual([1, 2, 3, 4, 5]);
    expect(paginationRange({ page: -3, pageCount: 0 })).toEqual([1]);
    expect(paginationRange({ page: 0, pageCount: 20 })).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 20]);
  });
});
