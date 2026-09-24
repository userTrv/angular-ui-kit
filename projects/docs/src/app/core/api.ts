import apiJson from '../generated/api.json';

export interface ApiInput {
  name: string;
  type: string;
  default?: string;
  required: boolean;
  twoWay: boolean;
  description: string;
}
export interface ApiOutput {
  name: string;
  type: string;
  description: string;
}
export interface ApiMember {
  name: string;
  signature?: string;
  type?: string;
  description: string;
}
export interface ApiItem {
  name: string;
  /** Set by findApi(): the entry point the symbol was found in. */
  entryPoint?: string;
  kind: string;
  selector?: string;
  exportAs?: string;
  description: string;
  signature?: string;
  inputs?: ApiInput[];
  outputs?: ApiOutput[];
  methods?: ApiMember[];
  properties?: ApiMember[];
}

export const API = apiJson as unknown as Record<string, ApiItem[]>;

/**
 * Looks a symbol up in the page's own entry point first. `'@usertrv/ui/listbox#UiListbox'` names
 * another entry point explicitly; a bare name that is not in the page's entry point falls back to
 * the first entry point that exports it (headless layers documented on the styled component's page).
 */
export function findApi(entryPoint: string, name: string): ApiItem | undefined {
  const [explicitEntry, symbol] = name.includes('#') ? name.split('#') : [entryPoint, name];
  const own = API[explicitEntry]?.find((item) => item.name === symbol);
  if (own) return { ...own, entryPoint: explicitEntry };
  if (name.includes('#')) return undefined;
  for (const [entry, items] of Object.entries(API)) {
    const item = items.find((i) => i.name === symbol);
    if (item) return { ...item, entryPoint: entry };
  }
  return undefined;
}
