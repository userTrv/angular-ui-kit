import { defineDoc } from '../../../core/doc-model';
import { RadioBasicExample } from './examples/radio-basic.example';
import { RadioObjectsExample } from './examples/radio-objects.example';
import { RadioSignalFormsExample } from './examples/radio-signal-forms.example';

export const doc = defineDoc({
  slug: 'radio',
  name: 'Radio group',
  category: 'Forms',
  summary: 'Single choice from a short list, built on native radio buttons with a labelled radiogroup.',
  entryPoint: '@usertrv/ui/radio',
  api: ['UiRadioGroup', 'UiRadioButton'],
  layering:
    '`ui-radio-group` owns the value (`FormValueControl<T | null>`), the shared `name` and the `radiogroup` role; each `ui-radio-button` renders a transparent native radio over the drawn circle. Values can be any type — `compareWith` matches objects.',
  examples: [
    { title: 'Basic', component: RadioBasicExample, file: 'radio-basic.example.ts', description: '`label` renders a visible group label and wires `aria-labelledby`. Disabled options are skipped by the arrow keys.' },
    { title: 'Horizontal, object values', component: RadioObjectsExample, file: 'radio-objects.example.ts', description: '`compareWith` selects the right option when the value is an equal copy rather than the same object.' },
    { title: 'Signal Forms with required', component: RadioSignalFormsExample, file: 'radio-signal-forms.example.ts', description: 'The group is marked as touched when focus leaves it; `submit()` touches it too, which reveals the error.' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Moves focus into the group, onto the checked option (or the first option when none is checked), and out of it again.' },
    { keys: 'ArrowDown / ArrowRight', action: 'Moves to the next enabled option and selects it; wraps around.' },
    { keys: 'ArrowUp / ArrowLeft', action: 'Moves to the previous enabled option and selects it; wraps around.' },
    { keys: 'Space', action: 'Selects the focused option if it is not selected yet.' },
  ],
  a11y: [
    'Follows the WAI-ARIA APG **Radio Group** pattern. The keyboard model comes from the browser: all options share one generated `name`, and same-name native radios already implement Tab-to-checked and arrow-moves-and-selects. That is more robust than a scripted roving tabindex (native form participation, screen reader virtual cursors, Windows high contrast) and needs no JavaScript.',
    'Consequence: arrow keys work in both directions whatever the `orientation`, and the unit tests can only assert the preconditions (shared name, native `disabled`, no swallowed keys); the keyboard behaviour itself is covered by browsers.',
    'The host has `role="radiogroup"` and is named by `label` (`aria-labelledby`), `aria-label` or your own `aria-labelledby`. Every group needs a name.',
    '`aria-required` and `aria-invalid` are set on the group; the invalid state shows after focus leaves the group (touched) or the form was submitted.',
    'Not supported: deselecting an option (native radios can not be unchecked by the user) and read-only groups.',
  ],
});
