import { Type } from '@angular/core';

export type DocCategory = 'Actions' | 'Forms' | 'Overlays' | 'Navigation' | 'Data display' | 'Feedback';

export interface ExampleDef {
  title: string;
  /** Short explanation; supports `code` and **bold**. */
  description?: string;
  component: Type<unknown>;
  /** File name of the example source, e.g. `button-variants.example.ts`. */
  file: string;
}

export interface KeyboardRow {
  /** Keys separated by ` / ` (alternatives) or ` + ` (chords), e.g. `Shift + Tab`. */
  keys: string;
  action: string;
}

/**
 * Metadata for one component page. `slug`, `name`, `category` and `summary` must be string
 * literals: scripts/gen-docs.mjs reads them statically to build the navigation without loading
 * the page chunk.
 */
export interface ComponentDoc {
  slug: string;
  name: string;
  category: DocCategory;
  summary: string;
  /** Secondary entry point, e.g. `@usertrv/ui/button`. */
  entryPoint: string;
  /** Exported symbols to document in the API section, in display order. */
  api: string[];
  examples: ExampleDef[];
  keyboard?: KeyboardRow[];
  /** Accessibility notes; supports `code` and **bold**. */
  a11y: string[];
  /** How the headless and styled layers are split for this component (optional). */
  layering?: string;
}

export interface DocEntry {
  slug: string;
  name: string;
  category: DocCategory;
  summary: string;
  loadDoc: () => Promise<ComponentDoc>;
  loadSources: () => Promise<Record<string, { code: string; html: string }>>;
}

export function defineDoc(doc: ComponentDoc): ComponentDoc {
  return doc;
}
