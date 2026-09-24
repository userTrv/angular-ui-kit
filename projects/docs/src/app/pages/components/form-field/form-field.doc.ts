import { defineDoc } from '../../../core/doc-model';
import { FormFieldAnatomyExample } from './examples/form-field-anatomy.example';
import { FormFieldReactiveFormsExample } from './examples/form-field-reactive-forms.example';
import { FormFieldSignalFormsExample } from './examples/form-field-signal-forms.example';
import { FormFieldTextareaExample } from './examples/form-field-textarea.example';

export const doc = defineDoc({
  slug: 'form-field',
  name: 'Input & form field',
  category: 'Forms',
  summary: 'Native inputs and textareas with label, hint, error, prefix and suffix, wired for Signal Forms and Reactive Forms.',
  entryPoint: '@usertrv/ui/form-field',
  api: ['UiFormField', 'UiInput', 'UiTextareaAutosize', 'UiLabel', 'UiHint', 'UiError', 'UiPrefix', 'UiSuffix', 'injectUiControlState'],
  layering:
    '`input[uiInput]` is a directive on the native element (value, `type`, autocomplete and IME stay native). `ui-form-field` only does layout and ARIA wiring: it finds the control through the `UI_FORM_FIELD_CONTROL` token, so other kit controls can sit in a field too. Form state is read by `injectUiControlState()`, a headless helper shared with checkbox, radio group and switch: it reads the Signal Forms `FormField` state directly, or turns `NgControl.control.events` into signals for Reactive and template-driven forms.',
  examples: [
    {
      title: 'Anatomy',
      component: FormFieldAnatomyExample,
      file: 'form-field-anatomy.example.ts',
      description: 'Prefix and suffix slots take icons, units or a button. Clicking the box padding focuses the input. Sizes follow the density tokens.',
    },
    {
      title: 'Auto-sizing textarea with a counter',
      component: FormFieldTextareaExample,
      file: 'form-field-textarea.example.ts',
      description: '`autosize` wraps CDK `CdkTextareaAutosize`; `ui-hint align="end"` is handy for a character counter.',
    },
    {
      title: 'Signal Forms',
      component: FormFieldSignalFormsExample,
      file: 'form-field-signal-forms.example.ts',
      description: 'Errors appear after a field is left or once `submit()` marks the form as touched; on an invalid submit focus moves to the first invalid control with `focusBoundControl()`. Every kit control binds with plain `[formField]`, no adapter.',
    },
    {
      title: 'Reactive Forms',
      component: FormFieldReactiveFormsExample,
      file: 'form-field-reactive-forms.example.ts',
      description: '`uiInput` reads validity and touched state from `formControlName`, and shows errors of untouched fields after the form is submitted. Custom controls need `UiControlValueAccessor`.',
    },
  ],
  keyboard: [
    { keys: 'Tab / Shift + Tab', action: 'Moves focus to and from the input (native behaviour); buttons in the suffix are separate tab stops.' },
  ],
  a11y: [
    '`ui-label` renders a native `<label for>` pointing at the control’s id (generated when you do not set one).',
    'Hints and the errors currently shown are listed in the control’s `aria-describedby`, errors first; your own `aria-describedby` ids are kept.',
    '`aria-invalid="true"` is set only while errors are visible (invalid **and** touched, or after the form was submitted), so a screen reader does not announce “invalid” for an empty field the user has not reached yet.',
    '`aria-required` mirrors the required validator (Signal Forms `required()`, `Validators.required`, or the `required` attribute); the visual `*` is `aria-hidden`.',
    'Errors are **not** a live region: they are announced when the field is focused. On an invalid submit, move focus to the first invalid control (see the Signal Forms example).',
    'Icons in the prefix/suffix should be `aria-hidden`; icon buttons there need an `aria-label`.',
    'A field without a visible label still needs one: use `<ui-label class="ui-sr-only">` rather than a placeholder.',
  ],
});
