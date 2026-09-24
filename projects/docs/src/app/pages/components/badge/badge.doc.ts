import { defineDoc } from '../../../core/doc-model';
import { BadgeTagsExample } from './examples/badge-tags.example';
import { BadgeVariantsExample } from './examples/badge-variants.example';

export const doc = defineDoc({
  slug: 'badge',
  name: 'Badge & tag',
  category: 'Data display',
  summary: 'Status badges in six semantic colours, subtle or solid, and removable tags for filters and keywords.',
  entryPoint: '@usertrv/ui/badge',
  api: ['UiBadge', 'UiTag', 'UiBadgeVariant', 'UiBadgeAppearance', 'UiBadgeSize'],
  examples: [
    {
      title: 'Badges',
      component: BadgeVariantsExample,
      file: 'badge-variants.example.ts',
      description: 'The text carries the meaning; colour and the optional `dot` only reinforce it. A bare count gets its context from visually hidden text.',
    },
    {
      title: 'Removable tags',
      component: BadgeTagsExample,
      file: 'badge-tags.example.ts',
      description: 'Each remove button is named “Remove Status: Open”. Backspace or Delete on it also emits `removed`. The example moves focus to the neighbouring tag after a removal.',
    },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Moves to the next tag’s remove button (tags without one are not focusable).' },
    { keys: 'Enter / Space', action: 'Removes the tag (native button).' },
    { keys: 'Backspace / Delete', action: 'Removes the tag whose remove button is focused.' },
  ],
  a11y: [
    'Badges are plain text: no role, not focusable. Never rely on colour alone — write the status (“Overdue”), and use `ui-sr-only` text for bare numbers (“12 failed checks”).',
    'Solid success/warning/info badges use the variant’s text colour as background, which keeps AA contrast in light, dark and high-contrast themes.',
    'The remove button’s accessible name is composed with `aria-labelledby` from a hidden “Remove” and the tag text, so it always matches the visible label.',
    'A tag does not remove itself or manage focus: delete it from your state in `(removed)` and move focus to a neighbour, otherwise focus falls back to `<body>`.',
    'Not included: a selectable chip listbox / chip grid (APG grid navigation between chips) or an input that turns text into tags.',
  ],
});
