import tokens from '../tokens/tokens.json';
import { UI_AVATAR_PALETTE, avatarColorIndex, initialsFrom } from './avatar-utils';

type Rgba = [number, number, number, number];
type TokenTree = { [key: string]: string | TokenTree };

function resolve(value: string): string {
  const ref = /^\{(.+)\}$/.exec(value);
  if (!ref) return value;
  const found = ref[1].split('.').reduce<string | TokenTree>((node, key) => (node as TokenTree)[key], tokens as unknown as TokenTree);
  return resolve(found as string);
}

function parse(color: string): Rgba {
  const hex = /^#([0-9a-f]{6})$/i.exec(color);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const rgb = /^rgb\((\d+) (\d+) (\d+)(?: \/ ([\d.]+))?\)$/.exec(color);
  if (!rgb) throw new Error(`Unsupported colour ${color}`);
  return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), rgb[4] ? Number(rgb[4]) : 1];
}

/** `color-mix(in srgb, a p, b)` for opaque colours. */
function mix([r, g, b]: Rgba, [br, bg, bb]: Rgba, p: number): Rgba {
  return [r * p + br * (1 - p), g * p + bg * (1 - p), b * p + bb * (1 - p), 1];
}

/** Composites a possibly translucent colour over an opaque one. */
function over([r, g, b, a]: Rgba, [br, bg, bb]: Rgba): Rgba {
  return [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a), 1];
}

function luminance([r, g, b]: Rgba): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: Rgba, b: Rgba): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('initialsFrom', () => {
  it('takes the first letters of the first and last word', () => {
    expect(initialsFrom('Ada King Lovelace')).toBe('AL');
    expect(initialsFrom('  grace   hopper ')).toBe('GH');
    expect(initialsFrom('Linus')).toBe('L');
  });

  it('handles empty names and non-Latin scripts', () => {
    expect(initialsFrom('')).toBe('');
    expect(initialsFrom(undefined)).toBe('');
    expect(initialsFrom('Кирилл Левин')).toBe('КЛ');
    expect(initialsFrom('𝓐lan Turing')).toBe('𝓐T');
  });
});

describe('avatarColorIndex', () => {
  it('is deterministic, case- and whitespace-insensitive', () => {
    expect(avatarColorIndex('Ada Lovelace')).toBe(avatarColorIndex(' ada lovelace '));
    const index = avatarColorIndex('Grace Hopper');
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(UI_AVATAR_PALETTE.length);
  });

  it('spreads names across the palette', () => {
    const names = ['Ada', 'Grace', 'Linus', 'Margaret', 'Alan', 'Barbara', 'Ken', 'Dennis', 'Radia', 'Tim', 'Frances', 'Edsger'];
    const used = new Set(names.map((n) => avatarColorIndex(n)));
    expect(used.size).toBeGreaterThanOrEqual(4);
  });
});

describe('UI_AVATAR_PALETTE', () => {
  const themes = tokens.semantic as unknown as Record<string, Record<string, string>>;

  for (const theme of ['light', 'dark', 'high-contrast']) {
    it(`meets WCAG AA (4.5:1) for initials in the ${theme} theme`, () => {
      const surface = parse(resolve(themes[theme]['color-surface']));
      for (const pair of UI_AVATAR_PALETTE) {
        const subtle = over(parse(resolve(themes[theme][pair.background])), surface);
        const fg = over(parse(resolve(themes[theme][pair.foreground])), subtle);
        // avatar.css tints the background with 12% of the text colour.
        const bg = mix(fg, subtle, 0.12);
        expect(contrast(fg, bg), `${theme}: ${pair.foreground} on ${pair.background}`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});
