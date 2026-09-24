/** What a keydown in the combobox input should do. */
export type ComboboxKeyAction = 'open' | 'open-first' | 'open-last' | 'close' | 'navigate' | 'pick' | 'commit' | 'clear';

/** @internal State needed to interpret a key press. */
export interface ComboboxKeyState {
  /** The user asked for the suggestions (they may still be empty). */
  open: boolean;
  /** The suggestions panel is actually shown. */
  expanded: boolean;
  hasActiveOption: boolean;
  /** The input has text or the combobox has a value. */
  hasContent: boolean;
}

/**
 * Maps a keydown in the input to an action, following the WAI-ARIA APG combobox with list
 * autocomplete. Returns `null` for keys the text input handles natively (typing, caret movement,
 * Home/End, Space).
 * @internal
 */
export function comboboxKeyAction(event: KeyboardEvent, state: ComboboxKeyState): ComboboxKeyAction | null {
  switch (event.key) {
    case 'ArrowDown':
      if (event.altKey) return 'open';
      return state.expanded ? 'navigate' : 'open-first';
    case 'ArrowUp':
      if (event.altKey) return 'close';
      return state.expanded ? 'navigate' : 'open-last';
    case 'PageUp':
    case 'PageDown':
      return state.expanded ? 'navigate' : null;
    case 'Enter':
      if (state.expanded && state.hasActiveOption) return 'pick';
      return state.open ? 'commit' : null;
    case 'Escape':
      if (state.open) return 'close';
      return state.hasContent ? 'clear' : null;
    case 'Tab':
      return state.open ? 'close' : null;
    default:
      return null;
  }
}
