import { ComboboxKeyAction, ComboboxKeyState, comboboxKeyAction } from './combobox-keys';

const closed: ComboboxKeyState = { open: false, expanded: false, hasActiveOption: false, hasContent: false };
const openNoActive: ComboboxKeyState = { open: true, expanded: true, hasActiveOption: false, hasContent: true };
const openActive: ComboboxKeyState = { ...openNoActive, hasActiveOption: true };
const withText: ComboboxKeyState = { ...closed, hasContent: true };

describe('comboboxKeyAction (APG list autocomplete keyboard table)', () => {
  const cases: [string, KeyboardEventInit, ComboboxKeyState, ComboboxKeyAction | null][] = [
    ['ArrowDown', {}, closed, 'open-first'],
    ['ArrowDown', {}, openNoActive, 'navigate'],
    ['ArrowDown', { altKey: true }, closed, 'open'],
    ['ArrowUp', {}, closed, 'open-last'],
    ['ArrowUp', {}, openActive, 'navigate'],
    ['ArrowUp', { altKey: true }, openActive, 'close'],
    ['PageDown', {}, openActive, 'navigate'],
    ['PageUp', {}, closed, null],
    ['Enter', {}, openActive, 'pick'],
    ['Enter', {}, openNoActive, 'commit'],
    ['Enter', {}, closed, null],
    ['Escape', {}, openActive, 'close'],
    ['Escape', {}, withText, 'clear'],
    ['Escape', {}, closed, null],
    ['Tab', {}, openActive, 'close'],
    ['Tab', {}, closed, null],
    ['Home', {}, openActive, null],
    ['End', {}, openActive, null],
    [' ', {}, openActive, null],
    ['a', {}, closed, null],
  ];

  it.each(cases)('%j %j', (key, init, state, expected) => {
    expect(comboboxKeyAction(new KeyboardEvent('keydown', { key, ...init }), state)).toBe(expected);
  });
});
