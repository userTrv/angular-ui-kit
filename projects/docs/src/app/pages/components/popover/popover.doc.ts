import { defineDoc } from '../../../core/doc-model';
import { PopoverFilterExample } from './examples/popover-filter.example';
import { PopoverProfileExample } from './examples/popover-profile.example';

export const doc = defineDoc({
  slug: 'popover',
  name: 'Popover',
  category: 'Overlays',
  summary: 'A non-modal dialog anchored to a button, for interactive content such as filters or a profile card.',
  entryPoint: '@usertrv/ui/popover',
  api: ['UiPopoverTrigger', 'UiPopover', 'UiPopoverClose', 'UiPopoverPosition', 'UiPopoverAutoFocus', 'UiPopoverCloseReason'],
  layering:
    '`uiPopover` only marks the template and its accessible name; `uiPopoverTrigger` owns the behaviour (CDK overlay with flexible connected positioning and flip, keyboard dispatcher for Escape, outside-click dispatcher). The content is rendered lazily into a `role="dialog"` panel that carries the styles.',
  examples: [
    {
      title: 'Filter panel',
      component: PopoverFilterExample,
      file: 'popover-filter.example.ts',
      description: 'Focus moves to the first checkbox on open. `uiPopoverClose` closes and returns focus to the trigger.',
    },
    {
      title: 'Profile card with actions',
      component: PopoverProfileExample,
      file: 'popover-profile.example.ts',
      description: '`uiPopoverPosition="end"` and `uiPopoverAutoFocus="panel"`: focus lands on the panel so the card is read from the top before the actions.',
    },
  ],
  keyboard: [
    { keys: 'Enter / Space', action: 'On the trigger: opens or closes the popover.' },
    { keys: 'Tab / Shift + Tab', action: 'Moves between elements inside. Tabbing past the last element or before the first closes the popover and returns focus to the trigger.' },
    { keys: 'Escape', action: 'Closes the popover and returns focus to the trigger.' },
    { keys: 'Tab (on the trigger)', action: 'With `uiPopoverAutoFocus="none"`, moves focus from the open trigger into the panel.' },
  ],
  a11y: [
    'A **non-modal dialog** (WAI-ARIA APG dialog pattern without `aria-modal`): the panel has `role="dialog"` and a name from `uiPopoverLabel` or `uiPopoverLabelledBy`. The page stays interactive.',
    'The trigger has `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls` pointing to the panel while it is open.',
    'The panel is rendered in the overlay container, far from the trigger in DOM order, so the tab sequence is managed: Tab past either end closes it and focus continues from the trigger. It is not a focus trap.',
    'Clicking outside closes it; focus returns to the trigger only if it was lost (clicking another control keeps focus there).',
    'For short non-interactive hints use the Tooltip; for a list of commands use the Menu, which has menu semantics and arrow-key navigation.',
  ],
});
