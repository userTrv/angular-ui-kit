import { defineDoc } from '../../../core/doc-model';
import { ToastQueueExample } from './examples/toast-queue.example';
import { ToastUndoExample } from './examples/toast-undo.example';
import { ToastVariantsExample } from './examples/toast-variants.example';

export const doc = defineDoc({
  slug: 'toast',
  name: 'Toast',
  category: 'Feedback',
  summary: 'Brief status messages with a queue, pausable timers, an optional action and screen reader announcements.',
  entryPoint: '@usertrv/ui/toast',
  api: ['UiToast', 'UiToastOptions', 'UiToastRef', 'UiToaster', 'provideUiToast', 'UiToastConfig', 'UI_TOAST_CONFIG'],
  layering:
    'State (queue, visible slice, countdowns, announcements) lives in a root store driven by signals, so rendering works zoneless and the timers are plain `setTimeout` + `Date.now()` that fake timers control. `ui-toaster` only renders the store; `UiToast.show()` mounts one in the CDK overlay container on first use unless the app placed `<ui-toaster>` itself.',
  examples: [
    {
      title: 'Variants',
      component: ToastVariantsExample,
      file: 'toast-variants.example.ts',
      description: 'The danger toast uses `duration: 0` and stays until closed: errors should not disappear before they are read.',
    },
    {
      title: 'Action: Undo',
      component: ToastUndoExample,
      file: 'toast-undo.example.ts',
      description: 'Toasts with an action stay twice as long by default and are announced with a hint to press **F8**.',
    },
    {
      title: 'Queue and pause on hover',
      component: ToastQueueExample,
      file: 'toast-queue.example.ts',
      description: 'At most three toasts are visible; the rest wait. Hover the toasts or tab into them: every countdown pauses and resumes with its remaining time.',
    },
  ],
  keyboard: [
    { keys: 'F8', action: 'Moves focus to the notifications region (configurable with `provideUiToast({ focusHotkey })`).' },
    { keys: 'Tab / Shift + Tab', action: 'Moves between action and close buttons inside the region.' },
    { keys: 'Escape', action: 'Inside the region: returns focus to where F8 was pressed.' },
    { keys: 'Enter / Space', action: 'Runs the action or closes the toast; focus moves to the next toast instead of being lost.' },
  ],
  a11y: [
    'Each toast is announced once through CDK `LiveAnnouncer` when it becomes visible: politely for info, success and warning, **assertively** for danger. Announcements are serialized so a burst is read in full. The region itself is not a live region, so nothing is read twice.',
    'Toasts never take focus. They sit in a `region` landmark named "Notifications" (listed by screen readers while toasts are shown) and **F8** jumps there; Escape jumps back.',
    'Countdowns pause while the pointer is over the toasts or focus is inside (WCAG 2.2.1 Timing adjustable), and `duration: 0` disables auto-dismiss. Queued toasts start counting only when visible.',
    'Close buttons are named after the toast ("Dismiss: Invoice sent"); the variant is conveyed by the text and announcement, the icon and colour are decorative.',
    'When a modal dialog is open, the auto-created toaster is raised above its backdrop so new toasts are readable, but keyboard focus stays trapped in the dialog.',
    'Not implemented: swipe to dismiss, per-toast positions, stacking/collapsing animations, and exit animations.',
  ],
});
