import { defineDoc } from '../../../core/doc-model';
import { SwitchLabelPositionExample } from './examples/switch-label-position.example';
import { SwitchSettingsExample } from './examples/switch-settings.example';

export const doc = defineDoc({
  slug: 'switch',
  name: 'Switch',
  category: 'Forms',
  summary: 'An on/off toggle for settings that take effect immediately, with an optional description.',
  entryPoint: '@usertrv/ui/switch',
  api: ['UiSwitch'],
  layering:
    'A transparent native `<input type="checkbox" role="switch">` sits over the drawn track. Signal Forms `FormCheckboxControl` (`checked` model); Reactive Forms and `ngModel` go through `UiControlValueAccessor`.',
  examples: [
    { title: 'Settings with descriptions', component: SwitchSettingsExample, file: 'switch-settings.example.ts', description: 'The description is linked with `aria-describedby`, so it is read after the name instead of becoming part of it.' },
    { title: 'Label before, with Signal Forms', component: SwitchLabelPositionExample, file: 'switch-label-position.example.ts', description: 'Settings lists often put the label first. `[formField]` binds a boolean field directly.' },
  ],
  keyboard: [
    { keys: 'Space', action: 'Toggles the switch (native behaviour).' },
    { keys: 'Tab / Shift + Tab', action: 'Moves focus to the next / previous control.' },
  ],
  a11y: [
    'Follows the WAI-ARIA APG **Switch** pattern using `role="switch"` on a native checkbox: screen readers announce “on/off”, and focus, Space and the label click stay native.',
    'The state is exposed through the native checked state, so no `aria-checked` is set by hand.',
    '**Enter** does not toggle (the APG lists it as optional; native checkboxes ignore it) — this keeps Enter free for implicit form submission.',
    'Use a switch only for changes that apply immediately; inside a form that is submitted later, a checkbox is clearer.',
    'Motion of the thumb uses the duration tokens, which drop to 0 under `prefers-reduced-motion`.',
  ],
});
