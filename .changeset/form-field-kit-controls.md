---
'@usertrv/ui': minor
---

`ui-select`, `ui-combobox` and `ui-datepicker` can sit inside `ui-form-field`: they provide `UI_FORM_FIELD_CONTROL` (via the new `provideUiFormFieldControl()`), take the field's label, hints, errors and `invalid` override, and the field skips its own box around them. `UI_FORM_FIELD_CONTEXT` is now public for custom controls.

**Breaking (pre-1.0):** `injectUiControlState()` and its types moved from `@usertrv/ui/form-field` to `@usertrv/ui/forms`. `ui-datepicker` now also reads required/invalid state from Reactive Forms and `ngModel`.
