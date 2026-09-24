/** A background/foreground pair of semantic colour tokens used for initials avatars. */
export interface UiAvatarColor {
  /** Semantic token name without `--ui-`, e.g. `color-primary-subtle`. */
  background: string;
  /** Semantic token name without `--ui-`, e.g. `color-primary-text`. */
  foreground: string;
}

/**
 * Colours for initials avatars. Every pair is a "subtle background + text" pair from the semantic
 * tokens, so it adapts to light, dark and high-contrast themes (the stylesheet tints the background
 * with 12% of the text colour). `avatar-utils.spec.ts` checks each rendered pair against WCAG AA
 * (4.5:1) in every theme from `tokens.json`. Danger red is left out on purpose:
 * a red avatar reads as an error state.
 */
export const UI_AVATAR_PALETTE: readonly UiAvatarColor[] = [
  { background: 'color-primary-subtle', foreground: 'color-primary-text' },
  { background: 'color-info-subtle', foreground: 'color-info-text' },
  { background: 'color-success-subtle', foreground: 'color-success-text' },
  { background: 'color-warning-subtle', foreground: 'color-warning-text' },
  { background: 'color-surface-hover', foreground: 'color-text' },
];

/**
 * Up to two initials from a display name: first letter of the first and the last word
 * ("Ada King Lovelace" -> "AL", "Ada" -> "A"). Unicode-aware (letters outside the BMP stay whole).
 */
export function initialsFrom(name: string | null | undefined): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = Array.from(words[0])[0] ?? '';
  const last = words.length > 1 ? (Array.from(words[words.length - 1])[0] ?? '') : '';
  return (first + last).toLocaleUpperCase();
}

/**
 * Deterministically maps a name to an index into `UI_AVATAR_PALETTE` (FNV-1a hash), so the
 * same person always gets the same colour across pages and sessions.
 */
export function avatarColorIndex(name: string, paletteSize = UI_AVATAR_PALETTE.length): number {
  let hash = 0x811c9dc5;
  for (const char of name.trim().toLocaleLowerCase()) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % paletteSize;
}
