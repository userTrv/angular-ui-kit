import { defineDoc } from '../../../core/doc-model';
import { DrawerBottomExample } from './examples/drawer-bottom.example';
import { DrawerEndExample } from './examples/drawer-end.example';
import { DrawerNavigationExample } from './examples/drawer-navigation.example';

export const doc = defineDoc({
  slug: 'drawer',
  name: 'Drawer',
  category: 'Overlays',
  summary: 'Side sheets and bottom sheets: modal dialogs attached to a screen edge, with the same focus and inert behaviour.',
  entryPoint: '@usertrv/ui/drawer',
  api: ['UiDrawer', 'UiDrawerConfig', 'UiDrawerPosition'],
  layering:
    '`UiDrawer` is a thin service over `UiDialog`: it passes a global position strategy and a sheet pane class, nothing else. Focus trap, `aria-modal`, the inert background, stacking, Escape and focus restoration are the dialog’s, and the dialog parts (`uiDialogTitle`, `uiDialogContent`, `uiDialogActions`, `uiDialogClose`) work inside a drawer unchanged.',
  examples: [
    {
      title: 'Side sheet with a result',
      component: DrawerEndExample,
      file: 'drawer-end.example.ts',
      description: 'Opens at the `end` edge (right in LTR, left in RTL), full height, `--ui-drawer-width` wide, and slides in over `--ui-duration-slow`.',
    },
    {
      title: 'Bottom sheet from a template',
      component: DrawerBottomExample,
      file: 'drawer-bottom.example.ts',
      description: '`position: \'bottom\'` with an `ng-template`; buttons close it with a typed result through `uiDialogClose`.',
    },
    {
      title: 'Navigation drawer',
      component: DrawerNavigationExample,
      file: 'drawer-navigation.example.ts',
      description: 'A `start` drawer with a `nav` landmark and `aria-current="page"` on the active item.',
    },
  ],
  keyboard: [
    { keys: 'Tab / Shift + Tab', action: 'Moves between focusable elements; focus wraps inside the drawer.' },
    { keys: 'Escape', action: 'Closes the drawer and returns focus to the element that opened it.' },
  ],
  a11y: [
    'A drawer is a modal dialog (WAI-ARIA APG **Dialog (Modal)** pattern) placed at an edge: `role="dialog"`, `aria-modal="true"`, labelled by `uiDialogTitle`.',
    'The page behind is `inert` and `aria-hidden` while it is open; focus returns to the opener when it closes.',
    'The slide-in uses the duration tokens, which drop to 0 under `prefers-reduced-motion`.',
    'Not implemented: persistent (non-modal) side panels that push the page content, swipe-to-close gestures and exit animations.',
  ],
});
