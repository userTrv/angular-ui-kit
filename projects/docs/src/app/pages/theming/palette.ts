/**
 * Brand palette generator: one hex colour -> an 11-step scale in OKLCH (perceptually even lightness),
 * gamut-mapped to sRGB by reducing chroma, plus a semantic mapping chosen by WCAG contrast.
 * Pure functions, no dependencies; see palette.spec.ts.
 */

export type Rgb = [number, number, number]; // 0..1 gamma-encoded sRGB
interface Oklch {
  l: number;
  c: number;
  h: number;
}

export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const LIGHTNESS = [0.97, 0.93, 0.87, 0.79, 0.7, 0.62, 0.54, 0.47, 0.4, 0.33, 0.24];

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function hexToRgb(hex: string): Rgb {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Invalid hex colour: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function rgbToHex(rgb: Rgb): string {
  return `#${rgb.map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, '0')).join('')}`;
}

function rgbToOklch([r, g, b]: Rgb): Oklch {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { l: L, c: Math.hypot(A, B), h: (Math.atan2(B, A) * 180) / Math.PI };
}

/** Returns linear sRGB (may be out of 0..1 when the colour is outside the sRGB gamut). */
function oklchToLinear({ l: L, c, h }: Oklch): Rgb {
  const A = c * Math.cos((h * Math.PI) / 180);
  const B = c * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const inGamut = (rgb: Rgb) => rgb.every((c) => c >= -1e-4 && c <= 1 + 1e-4);

/** OKLCH -> sRGB, reducing chroma (binary search) until the colour fits the sRGB gamut. */
function oklchToRgb(color: Oklch): Rgb {
  let lo = 0;
  let hi = color.c;
  let linear = oklchToLinear(color);
  if (!inGamut(linear)) {
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear({ ...color, c: mid }))) lo = mid;
      else hi = mid;
    }
    linear = oklchToLinear({ ...color, c: lo });
  }
  return linear.map((c) => toGamma(Math.min(1, Math.max(0, c)))) as Rgb;
}

export function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio, 1..21. */
export function contrast(a: string, b: string): number {
  const [la, lb] = [luminance(hexToRgb(a)), luminance(hexToRgb(b))].sort((x, y) => y - x);
  return (la + 0.05) / (lb + 0.05);
}

export interface PaletteStep {
  step: (typeof STEPS)[number];
  hex: string;
  onWhite: number;
  onBlack: number;
}

export function generatePalette(brandHex: string): PaletteStep[] {
  const base = rgbToOklch(hexToRgb(brandHex));
  return STEPS.map((step, i) => {
    const l = LIGHTNESS[i];
    // Taper chroma towards the very light and very dark ends, where high chroma looks neon or muddy.
    const taper = 1 - Math.abs(l - 0.58) * 0.9;
    const hex = rgbToHex(oklchToRgb({ l, c: base.c * Math.max(0.25, taper), h: base.h }));
    return { step, hex, onWhite: contrast(hex, '#ffffff'), onBlack: contrast(hex, '#000000') };
  });
}

export interface BrandTheme {
  light: Record<string, string>;
  dark: Record<string, string>;
}

/**
 * Picks steps for the semantic primary tokens so that text contrast is at least AA (4.5:1):
 * light theme — white text on `primary`, `primary-text` on white; dark theme — near-black text on
 * `primary`, `primary-text` on the dark background (#0e1015).
 */
export function brandTheme(palette: PaletteStep[], darkBg = '#0e1015'): BrandTheme {
  const at = (step: number) => palette.find((p) => p.step === step)!.hex;
  const idx = (hex: string) => palette.findIndex((p) => p.hex === hex);
  const lightPrimary = palette.find((p) => p.step >= 500 && p.onWhite >= 4.5) ?? palette[palette.length - 2];
  const lp = idx(lightPrimary.hex);
  const darkPrimary = [...palette].reverse().find((p) => p.step <= 500 && contrast(p.hex, darkBg) >= 4.5 && p.onBlack >= 7) ?? palette[3];
  const dp = idx(darkPrimary.hex);
  return {
    light: {
      'color-primary': lightPrimary.hex,
      'color-primary-hover': palette[Math.min(lp + 1, palette.length - 1)].hex,
      'color-primary-active': palette[Math.min(lp + 2, palette.length - 1)].hex,
      'color-primary-text': palette[Math.min(lp + 1, palette.length - 1)].hex,
      'color-primary-subtle': at(50),
      'color-primary-subtle-hover': at(100),
      'color-focus-ring': palette[Math.max(lp - 1, 0)].hex,
      'color-on-primary': '#ffffff',
    },
    dark: {
      'color-primary': darkPrimary.hex,
      'color-primary-hover': palette[Math.max(dp - 1, 0)].hex,
      'color-primary-active': palette[Math.max(dp - 2, 0)].hex,
      'color-primary-text': palette[Math.max(dp - 1, 0)].hex,
      'color-primary-subtle': `color-mix(in srgb, ${at(500)} 18%, transparent)`,
      'color-primary-subtle-hover': `color-mix(in srgb, ${at(500)} 28%, transparent)`,
      'color-focus-ring': palette[Math.max(dp - 1, 0)].hex,
      'color-on-primary': '#0e1015',
    },
  };
}

export function themeCss(theme: BrandTheme): string {
  const block = (sel: string, vars: Record<string, string>, indent = '') =>
    `${indent}${sel} {\n${Object.entries(vars)
      .map(([k, v]) => `${indent}  --ui-${k}: ${v};`)
      .join('\n')}\n${indent}}`;
  return [
    block(":root,\n[data-ui-theme='light']", theme.light),
    block("[data-ui-theme='dark']", theme.dark),
    `@media (prefers-color-scheme: dark) {\n${block(':root:not([data-ui-theme])', theme.dark, '  ')}\n}`,
  ].join('\n');
}
