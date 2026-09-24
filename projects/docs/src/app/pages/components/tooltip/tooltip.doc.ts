import { defineDoc } from '../../../core/doc-model';
import { TooltipPositionsExample } from './examples/tooltip-positions.example';
import { TooltipToolbarExample } from './examples/tooltip-toolbar.example';

export const doc = defineDoc({
  slug: 'tooltip',
  name: 'Tooltip',
  category: 'Overlays',
  summary: 'A short text description shown on hover and keyboard focus, dismissible with Escape and hoverable.',
  entryPoint: '@usertrv/ui/tooltip',
  api: ['UiTooltip', 'UiTooltipPosition'],
  layering:
    'A single attribute directive: CDK flexible connected positioning (preferred side first, then the opposite side as a flip), CDK `FocusMonitor` to tell keyboard focus from mouse focus, and the CDK keyboard dispatcher so Escape reaches only the topmost overlay.',
  examples: [
    {
      title: 'Icon toolbar',
      component: TooltipToolbarExample,
      file: 'tooltip-toolbar.example.ts',
      description: 'The `aria-label` names each icon button; the tooltip adds the keyboard shortcut as a description. Hover waits `uiTooltipShowDelay` (300 ms), keyboard focus shows it at once.',
    },
    {
      title: 'Positions',
      component: TooltipPositionsExample,
      file: 'tooltip-positions.example.ts',
      description: '`uiTooltipPosition` is a preference: the tooltip flips when there is no room. `start`/`end` follow the text direction.',
    },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Focusing the trigger with the keyboard shows the tooltip immediately.' },
    { keys: 'Escape', action: 'Hides the tooltip without moving focus; it stays hidden until focus and hover leave the trigger.' },
  ],
  a11y: [
    'Follows the WAI-ARIA APG **Tooltip** pattern: the bubble has `role="tooltip"` and, while it is shown, its id is added to the trigger’s `aria-describedby` (existing ids are kept).',
    'WCAG 1.4.13 (content on hover or focus): **dismissible** with Escape without moving pointer or focus, **hoverable** (the pointer can move onto the tooltip; a 100 ms grace period covers the gap), and **persistent** until hover and focus leave.',
    'Shown for keyboard focus (focus-visible) only, not after a mouse click, and hidden when the trigger is pressed.',
    'A tooltip is a description, not a name: icon-only buttons still need `aria-label`. Text only; for interactive content use the Popover.',
    'No tooltip on disabled triggers (`disabled`, `aria-disabled="true"` or `uiTooltipDisabled`); explain why something is disabled in visible text instead.',
    '**Touch:** tooltips are not shown for touch input (no long-press), so never put information that is needed to complete a task only in a tooltip.',
  ],
});
