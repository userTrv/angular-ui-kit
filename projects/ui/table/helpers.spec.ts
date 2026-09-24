import { moveGridPosition } from './grid-nav';
import { rangeBetween, selectAllState, setKeys, toggleKey } from './selection';

describe('selection helpers', () => {
  it('toggles a key', () => {
    expect(toggleKey([1, 2], 3)).toEqual([1, 2, 3]);
    expect(toggleKey([1, 2, 3], 2)).toEqual([1, 3]);
  });

  it('adds and removes sets of keys without duplicates', () => {
    expect(setKeys(['a', 'b'], ['b', 'c'], true)).toEqual(['a', 'b', 'c']);
    expect(setKeys(['a', 'b', 'c'], ['a', 'c'], false)).toEqual(['b']);
  });

  it('builds a range in display order in either direction', () => {
    const order = ['r1', 'r2', 'r3', 'r4', 'r5'];
    expect(rangeBetween(order, 'r2', 'r4')).toEqual(['r2', 'r3', 'r4']);
    expect(rangeBetween(order, 'r4', 'r2')).toEqual(['r2', 'r3', 'r4']);
    expect(rangeBetween(order, 'gone', 'r3')).toEqual(['r3']);
  });

  it('reports the select-all state', () => {
    expect(selectAllState([1, 2, 3], new Set([1, 2, 3]))).toBe('all');
    expect(selectAllState([1, 2, 3], new Set([2]))).toBe('some');
    expect(selectAllState([1, 2, 3], new Set([9]))).toBe('none');
    expect(selectAllState([], new Set([1]))).toBe('none');
  });
});

describe('moveGridPosition', () => {
  const bounds = { rows: 101, cols: 5, pageSize: 10 };
  const key = (k: string, ctrlKey = false) => ({ key: k, ctrlKey, metaKey: false });

  it('moves with arrows and stops at the edges', () => {
    expect(moveGridPosition({ row: 0, col: 0 }, key('ArrowDown'), bounds)).toEqual({
      row: 1,
      col: 0,
    });
    expect(moveGridPosition({ row: 0, col: 0 }, key('ArrowUp'), bounds)).toEqual({
      row: 0,
      col: 0,
    });
    expect(moveGridPosition({ row: 3, col: 4 }, key('ArrowRight'), bounds)).toEqual({
      row: 3,
      col: 4,
    });
    expect(moveGridPosition({ row: 3, col: 4 }, key('ArrowLeft'), bounds)).toEqual({
      row: 3,
      col: 3,
    });
  });

  it('mirrors horizontal arrows in RTL', () => {
    expect(
      moveGridPosition({ row: 1, col: 1 }, key('ArrowLeft'), { ...bounds, rtl: true }),
    ).toEqual({ row: 1, col: 2 });
  });

  it('pages by pageSize and clamps', () => {
    expect(moveGridPosition({ row: 5, col: 2 }, key('PageDown'), bounds)).toEqual({
      row: 15,
      col: 2,
    });
    expect(moveGridPosition({ row: 5, col: 2 }, key('PageUp'), bounds)).toEqual({ row: 0, col: 2 });
    expect(moveGridPosition({ row: 95, col: 2 }, key('PageDown'), bounds)).toEqual({
      row: 100,
      col: 2,
    });
  });

  it('supports Home/End in the row and Ctrl+Home/End in the grid', () => {
    expect(moveGridPosition({ row: 7, col: 2 }, key('Home'), bounds)).toEqual({ row: 7, col: 0 });
    expect(moveGridPosition({ row: 7, col: 2 }, key('End'), bounds)).toEqual({ row: 7, col: 4 });
    expect(moveGridPosition({ row: 7, col: 2 }, key('Home', true), bounds)).toEqual({
      row: 0,
      col: 0,
    });
    expect(moveGridPosition({ row: 7, col: 2 }, key('End', true), bounds)).toEqual({
      row: 100,
      col: 4,
    });
  });

  it('ignores other keys', () => {
    expect(moveGridPosition({ row: 0, col: 0 }, key('Enter'), bounds)).toBeNull();
  });
});
