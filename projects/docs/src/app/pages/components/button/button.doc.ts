import { defineDoc } from '../../../core/doc-model';
import { ButtonIconExample } from './examples/button-icon.example';
import { ButtonLoadingExample } from './examples/button-loading.example';
import { ButtonSizesExample } from './examples/button-sizes.example';
import { ButtonVariantsExample } from './examples/button-variants.example';

export const doc = defineDoc({
  slug: 'button',
  name: 'Button',
  category: 'Actions',
  summary: 'Native `<button>` and `<a>` elements with variants, sizes, icon-only and loading states.',
  entryPoint: '@usertrv/ui/button',
  api: ['UiButton'],
  layering:
    'An attribute component on the native element: focus, form submission, `type` and link semantics stay native. No wrapper element, no re-implemented click handling.',
  examples: [
    { title: 'Variants', component: ButtonVariantsExample, file: 'button-variants.example.ts' },
    { title: 'Sizes and disabled', component: ButtonSizesExample, file: 'button-sizes.example.ts', description: 'Heights follow the density tokens: switch **Density** to **Compact** (in the header, or in the navigation menu on small screens).' },
    { title: 'With icons', component: ButtonIconExample, file: 'button-icon.example.ts', description: '`uiIconButton` is square and requires an `aria-label`; a dev-mode warning catches a missing one.' },
    { title: 'Loading', component: ButtonLoadingExample, file: 'button-loading.example.ts', description: 'Loading keeps focus on the button (`aria-disabled` + `aria-busy`), unlike `disabled`, which would drop focus to `<body>`.' },
  ],
  keyboard: [
    { keys: 'Enter / Space', action: 'Activates the button (native behaviour).' },
    { keys: 'Enter', action: 'Follows the link for `a[uiButton]`.' },
  ],
  a11y: [
    'Uses the native element, so the role, focusability and activation keys come from the browser.',
    'Disabled links get `aria-disabled="true"` and `tabindex="-1"`; clicks are cancelled in the capture phase before your handlers run.',
    'While `loading`, the button stays focusable and exposes `aria-busy="true"`; announce the result separately (for example with a live region or a toast).',
    'Icons inside buttons should be `aria-hidden="true"`; the text or `aria-label` is the accessible name.',
    'Focus ring uses `outline`, which stays visible in Windows forced-colors mode.',
  ],
});
