import { brandTheme, contrast, generatePalette, hexToRgb, rgbToHex, themeCss } from './palette';

describe('brand palette generator', () => {
  it('round-trips hex colours', () => {
    expect(rgbToHex(hexToRgb('#5745e3'))).toBe('#5745e3');
    expect(() => hexToRgb('blue')).toThrow();
  });

  it('computes WCAG contrast ratios', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrast('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
  });

  it('produces 11 steps from light to dark', () => {
    const palette = generatePalette('#0f766e');
    expect(palette).toHaveLength(11);
    const luminanceOrder = palette.map((p) => p.onBlack);
    expect([...luminanceOrder].sort((a, b) => b - a)).toEqual(luminanceOrder);
  });

  for (const brand of ['#0f766e', '#e11d48', '#facc15', '#2563eb', '#7c3aed', '#16a34a']) {
    it(`maps ${brand} to AA-compliant primary tokens in light and dark themes`, () => {
      const theme = brandTheme(generatePalette(brand));
      expect(contrast(theme.light['color-primary'], '#ffffff')).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.light['color-primary-text'], '#ffffff')).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.dark['color-primary'], '#0e1015')).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.dark['color-primary'], theme.dark['color-on-primary'])).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.dark['color-primary-text'], '#0e1015')).toBeGreaterThanOrEqual(4.5);
    });
  }

  it('emits CSS for light, dark and system-dark', () => {
    const css = themeCss(brandTheme(generatePalette('#0f766e')));
    expect(css).toContain("[data-ui-theme='dark']");
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toMatch(/--ui-color-primary: #[0-9a-f]{6};/);
  });
});
