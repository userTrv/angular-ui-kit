import { defineDoc } from '../../../core/doc-model';
import { AccordionFaqExample } from './examples/accordion-faq.example';
import { AccordionMultiExample } from './examples/accordion-multi.example';

export const doc = defineDoc({
  slug: 'accordion',
  name: 'Accordion',
  category: 'Navigation',
  summary: 'Stacked disclosure sections with heading semantics, single or multiple expansion and a CSS-only height animation.',
  entryPoint: '@usertrv/ui/accordion',
  api: ['UiAccordion', 'UiAccordionItem'],
  layering:
    '`ui-accordion` and `ui-accordion-item` compose CDK `CdkAccordion` / `CdkAccordionItem` as **host directives**; the CDK coordinates single vs. multi expansion. The public API is signal-based (`multi`, `[(expanded)]`, `disabled`) and synced into the CDK directives.',
  examples: [
    {
      title: 'FAQ (one open at a time)',
      component: AccordionFaqExample,
      file: 'accordion-faq.example.ts',
      description: 'By default opening an item closes the others. Disabled items keep a focusable header with `aria-disabled`.',
    },
    {
      title: 'Multiple open sections',
      component: AccordionMultiExample,
      file: 'accordion-multi.example.ts',
      description: '`multi` allows several open items; `openAll()` / `closeAll()` via `#ref="uiAccordion"`. A projected `[uiAccordionTitle]` replaces the plain `label`; `headingLevel` matches the page outline.',
    },
  ],
  keyboard: [
    { keys: 'Enter / Space', action: 'Expands or collapses the focused section (native button).' },
    { keys: 'Tab', action: 'Moves through headers and the content of expanded sections.' },
    { keys: 'ArrowDown / ArrowUp', action: 'Moves focus to the next / previous header (wraps).' },
    { keys: 'Home / End', action: 'Moves focus to the first / last header.' },
  ],
  a11y: [
    'Implements the WAI-ARIA APG **Accordion** pattern: each header is a `<button>` with `aria-expanded` and `aria-controls` inside `role="heading"` with a configurable `aria-level` (`headingLevel`, default 3).',
    'Panels are `role="region"` labelled by their header. APG suggests avoiding the region role when many panels can be open at once; keep accordions short or omit headings you do not need.',
    'Includes the optional APG arrow-key navigation between headers; keys pressed inside panel content are ignored.',
    'Collapsed panels are `inert` and `visibility: hidden`, so their content is out of the tab order and the accessibility tree while the height animation runs.',
    'The height animation uses the `grid-template-rows: 0fr → 1fr` technique (no JavaScript measuring) with the duration tokens, which drop to 0 under `prefers-reduced-motion`.',
    'Not included: lazy panel content (content is created up front) and an "always one open" mode.',
  ],
});
