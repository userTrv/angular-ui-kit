import { defineDoc } from '../../../core/doc-model';
import { CheckboxFormsExample } from './examples/checkbox-forms.example';
import { CheckboxSelectAllExample } from './examples/checkbox-select-all.example';
import { CheckboxStatesExample } from './examples/checkbox-states.example';

export const doc = defineDoc({
  slug: 'checkbox',
  name: 'Checkbox',
  category: 'Forms',
  summary: 'A native checkbox with a custom box, mixed state and Signal Forms / Reactive Forms support.',
  entryPoint: '@usertrv/ui/checkbox',
  api: ['UiCheckbox'],
  layering:
    'A transparent native `<input type="checkbox">` covers the drawn box, so clicks, focus and the checked/mixed state stay native; the SVG only paints. The component is a Signal Forms `FormCheckboxControl` (`checked` model) and registers with `UiControlValueAccessor` for Reactive Forms and `ngModel`.',
  examples: [
    { title: 'States', component: CheckboxStatesExample, file: 'checkbox-states.example.ts', description: 'The projected content is the label; `[(checked)]` is a two-way `model()`.' },
    {
      title: 'Select all (mixed state)',
      component: CheckboxSelectAllExample,
      file: 'checkbox-select-all.example.ts',
      description: '`indeterminate` sets the native property, which browsers expose as `aria-checked="mixed"`. Clicking a mixed checkbox checks it.',
    },
    {
      title: 'Reactive Forms with an error',
      component: CheckboxFormsExample,
      file: 'checkbox-forms.example.ts',
      description: 'With `Validators.requiredTrue` the checkbox gets `aria-required`, and `aria-invalid` once it is touched. Reference the error text with `aria-describedby`.',
    },
  ],
  keyboard: [
    { keys: 'Space', action: 'Toggles the checkbox (native behaviour).' },
    { keys: 'Tab / Shift + Tab', action: 'Moves focus to the next / previous control.' },
  ],
  a11y: [
    'Follows the WAI-ARIA APG **Checkbox** pattern (dual and mixed state) with a native input, so no ARIA role is added by hand.',
    'The label wraps the input, so clicking the text toggles it and the text is the accessible name. Without visible text, set `aria-label`.',
    'Mixed state uses the native `indeterminate` property (announced as “mixed” / “partially checked”). The user can not set mixed; the first click checks the box.',
    'Invalid state shows only after the control is touched (or, with Reactive Forms, after the form is submitted), and sets `aria-invalid`.',
    '`aria-required` is used instead of the native `required` attribute, so browser validation bubbles do not compete with your error messages.',
    'Group related checkboxes in a `<fieldset>` with a `<legend>`.',
    'Not supported: a `value` input — the Signal Forms `FormCheckboxControl` contract reserves `value`; use the boolean model or a `name` for native form posts.',
  ],
});
