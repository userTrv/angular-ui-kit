import { defineDoc } from '../../../core/doc-model';
import { DialogBasicExample } from './examples/dialog-basic.example';
import { DialogConfirmExample } from './examples/dialog-confirm.example';
import { DialogFormExample } from './examples/dialog-form.example';
import { DialogStackedExample } from './examples/dialog-stacked.example';

export const doc = defineDoc({
  slug: 'dialog',
  name: 'Dialog',
  category: 'Overlays',
  summary: 'Modal dialogs opened from a service, with typed results, confirmations, stacking and an inert background.',
  entryPoint: '@usertrv/ui/dialog',
  api: ['UiDialog', 'UiDialogRef', 'UiDialogConfig', 'UI_DIALOG_DATA', 'UiDialogTitle', 'UiDialogContent', 'UiDialogActions', 'UiDialogClose', 'UiConfirmOptions'],
  layering:
    '`@angular/cdk/dialog` does the heavy lifting: focus trap, initial focus, Escape for the topmost dialog, `role` and `aria-labelledby` on the container, `aria-hidden` on the page. The kit adds a styled container (a subclass of the CDK one), `aria-modal="true"`, `inert` on the background, focus restoration after `inert` is lifted, the typed `UiDialogRef`, the template parts and `confirm()`. `UiDrawer` reuses all of it with a different position.',
  examples: [
    {
      title: 'Basic',
      component: DialogBasicExample,
      file: 'dialog-basic.example.ts',
      description: '`UiDialog.open(Component, { size })` with `uiDialogTitle`, `uiDialogContent` (the only part that scrolls) and `uiDialogActions`. `lg` goes full screen on narrow viewports.',
    },
    {
      title: 'Confirmation',
      component: DialogConfirmExample,
      file: 'dialog-confirm.example.ts',
      description: '`confirm()` opens an `alertdialog` described by its message and resolves to a boolean. Focus starts on the **least destructive** button.',
    },
    {
      title: 'Stacked dialogs',
      component: DialogStackedExample,
      file: 'dialog-stacked.example.ts',
      description: 'A confirmation opened from inside a dialog. The lower dialog becomes `inert`; Escape closes only the top one and focus goes back to the button that opened it.',
    },
    {
      title: 'Form with a result',
      component: DialogFormExample,
      file: 'dialog-form.example.ts',
      description: 'Data goes in through `UI_DIALOG_DATA`, the result comes back through `UiDialogRef.close()` and `ref.result`. `uiDialogClose` buttons default to `type="button"`, so Cancel never submits the form.',
    },
  ],
  keyboard: [
    { keys: 'Tab / Shift + Tab', action: 'Moves between focusable elements; focus wraps inside the dialog.' },
    { keys: 'Escape', action: 'Closes the topmost dialog (unless `disableClose`); focus returns to the element that opened it.' },
    { keys: 'Enter / Space', action: 'Activates the focused button; `uiDialogClose` closes with its result.' },
  ],
  a11y: [
    'Follows the WAI-ARIA APG **Dialog (Modal)** pattern: `role="dialog"` (or `alertdialog`), `aria-modal="true"`, labelled by `uiDialogTitle` through `aria-labelledby`. Use `ariaLabel` when there is no visible title.',
    'Everything behind the top dialog is `inert` (not focusable, not clickable, hidden from find-in-page) on top of the `aria-hidden` that CDK sets. Lower dialogs in a stack are inert too. Live regions and native popovers are left alone so announcements keep working.',
    'Initial focus goes to the first tabbable element by default (`autoFocus` accepts `dialog`, `first-heading` or a selector). `confirm()` focuses Cancel, as the APG recommends for destructive confirmations.',
    'Focus returns to the opener after close, only if focus was lost with the dialog: it never steals focus the app moved on purpose.',
    'Long content scrolls inside `uiDialogContent`, which becomes focusable when it overflows so it can be scrolled from the keyboard.',
    'Not implemented: exit animations (the dialog is removed immediately; the enter animation respects `prefers-reduced-motion` through the duration tokens) and draggable or non-modal dialogs (use the Popover for non-modal content).',
  ],
});
