import { defineDoc } from '../../../core/doc-model';
import { TabsAutomaticExample } from './examples/tabs-automatic.example';
import { TabsLazyExample } from './examples/tabs-lazy.example';
import { TabsManualExample } from './examples/tabs-manual.example';
import { TabsVerticalExample } from './examples/tabs-vertical.example';

export const doc = defineDoc({
  slug: 'tabs',
  name: 'Tabs',
  category: 'Navigation',
  summary: 'APG tabs with automatic or manual activation, vertical orientation, rich labels and lazy panels.',
  entryPoint: '@usertrv/ui/tabs',
  api: ['UiTabGroup', 'UiTab', 'UiTabLabel', 'UiTabContent', 'UiTabActivation'],
  layering:
    'Roving focus comes from the headless `UiRovingFocusGroup` in `@usertrv/ui/a11y` (CDK `FocusKeyManager`), the same primitive radio groups use. `ui-tab` only declares content; `ui-tab-group` renders the tab buttons and panels, so ids and ARIA relationships are wired in one place.',
  examples: [
    {
      title: 'Automatic activation',
      component: TabsAutomaticExample,
      file: 'tabs-automatic.example.ts',
      description: 'Arrow keys move focus **and** select. Use it when panels render instantly. `[(selectedIndex)]` is two-way bindable; disabled tabs are skipped.',
    },
    {
      title: 'Manual activation',
      component: TabsManualExample,
      file: 'tabs-manual.example.ts',
      description: '`activation="manual"`: arrows only move focus, Enter or Space selects. Prefer it when showing a panel is expensive (network, heavy rendering).',
    },
    {
      title: 'Vertical',
      component: TabsVerticalExample,
      file: 'tabs-vertical.example.ts',
      description: '`orientation="vertical"` switches the arrows to Up/Down and sets `aria-orientation`.',
    },
    {
      title: 'Lazy content',
      component: TabsLazyExample,
      file: 'tabs-lazy.example.ts',
      description: 'Content in `<ng-template uiTabContent>` is created when its tab is selected and destroyed when it is deselected. Directly projected content is created eagerly.',
    },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Moves focus into the tablist, onto the selected tab; the next Tab moves to the panel.' },
    { keys: 'ArrowRight / ArrowLeft', action: 'Horizontal: focuses the next / previous tab (wraps, skips disabled). Selects it in automatic mode.' },
    { keys: 'ArrowDown / ArrowUp', action: 'Vertical: focuses the next / previous tab.' },
    { keys: 'Home / End', action: 'Focuses the first / last tab.' },
    { keys: 'Enter / Space', action: 'Manual mode: selects the focused tab.' },
  ],
  a11y: [
    'Implements the WAI-ARIA APG **Tabs** pattern: `role="tablist"` (named by the `aria-label` you put on `ui-tab-group`), `role="tab"` with `aria-selected` and `aria-controls`, and `role="tabpanel"` with `aria-labelledby`.',
    'Roving tabindex: only the selected tab is in the tab order, so Tab moves from the tablist straight to the panel.',
    'A panel without focusable content gets `tabindex="0"` so keyboard users can reach and scroll it; a panel with focusable content is not a tab stop itself (APG).',
    'Disabled tabs expose `aria-disabled` and are skipped by the arrow keys.',
    'The selection indicator animates with the duration tokens (no motion under `prefers-reduced-motion`) and switches to `Highlight` in forced-colors mode; the selected tab also changes text colour.',
    'Not included: scroll buttons for overflowing tab lists (the list scrolls natively), closable or reorderable tabs, and routing integration (use links with `aria-current` for page navigation).',
  ],
});
