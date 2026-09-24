import tokens from '../../../../../ui/tokens/tokens.json';

export type TokenTier = 'primitive' | 'semantic' | 'density' | 'component';

export interface TokenRow {
  tier: TokenTier;
  cssVar: string;
  /** Value per variant: theme for semantic, density for density, 'value' otherwise. */
  values: Record<string, string>;
  isColor: boolean;
}

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix: string[] = []): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [[[...prefix, key].join('-'), value] as [string, string]] : flatten(value, [...prefix, key]),
  );
}

/** `{primitive.color.iris.600}` -> `--ui-color-iris-600`, for display. */
export function displayValue(value: string): string {
  return value.replace(/\{(?:primitive|semantic|density)\.([^}]+)\}/g, (_, path: string) => `--ui-${path.replace(/\./g, '-')}`);
}

const isColorName = (name: string) => name.startsWith('color-') || name.endsWith('-bg') || name.endsWith('-text') || name.includes('-row-') || name.endsWith('-indicator') || name.endsWith('-border') || name.endsWith('-border-hover') || name.endsWith('-border-focus');

function rows(): TokenRow[] {
  const t = tokens as unknown as { primitive: Tree; semantic: Record<string, Tree>; density: Record<string, Tree>; component: Tree };
  const result: TokenRow[] = [];
  for (const [name, value] of flatten(t.primitive)) {
    result.push({ tier: 'primitive', cssVar: `--ui-${name}`, values: { value }, isColor: name.startsWith('color-') });
  }
  const themes = Object.keys(t.semantic);
  for (const [name] of flatten(t.semantic[themes[0]])) {
    const values: Record<string, string> = {};
    for (const theme of themes) values[theme] = flatten(t.semantic[theme]).find(([n]) => n === name)?.[1] ?? '';
    result.push({ tier: 'semantic', cssVar: `--ui-${name}`, values, isColor: name.startsWith('color-') && name !== 'color-scheme' });
  }
  const densities = Object.keys(t.density);
  for (const [name] of flatten(t.density[densities[0]])) {
    const values: Record<string, string> = {};
    for (const d of densities) values[d] = flatten(t.density[d]).find(([n]) => n === name)?.[1] ?? '';
    result.push({ tier: 'density', cssVar: `--ui-${name}`, values, isColor: false });
  }
  for (const [name, value] of flatten(t.component)) {
    result.push({ tier: 'component', cssVar: `--ui-${name}`, values: { value }, isColor: isColorName(name) });
  }
  return result;
}

export const TOKEN_ROWS = rows();
export const THEMES = Object.keys((tokens as unknown as { semantic: object }).semantic);
export const DENSITIES = Object.keys((tokens as unknown as { density: object }).density);
