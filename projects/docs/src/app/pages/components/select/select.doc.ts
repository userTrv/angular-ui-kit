import { defineDoc } from '../../../core/doc-model';
import { SelectBasicExample } from './examples/select-basic.example';
import { SelectFormsExample } from './examples/select-forms.example';
import { SelectGroupsExample } from './examples/select-groups.example';
import { SelectMultipleExample } from './examples/select-multiple.example';

export const doc = defineDoc({
  slug: 'select',
  name: 'Select',
  category: 'Forms',
  summary: 'Select-only combobox with a listbox popup: groups, disabled options, multiple selection and typeahead.',
  entryPoint: '@usertrv/ui/select',
  api: [
    'UiSelect',
    'UiSelectOption',
    'UiSelectOptionGroup',
    '@usertrv/ui/listbox#UiListbox',
    '@usertrv/ui/listbox#UiOption',
    '@usertrv/ui/listbox#UiOptionGroup',
    '@usertrv/ui/listbox#createListboxPopup',
  ],
  layering:
    'Three layers. `@usertrv/ui/listbox` is headless: `uiListbox` (selection, CDK `ActiveDescendantKeyManager`, typeahead), `uiOption`, `uiOptionGroup` and `createListboxPopup()` (CDK overlay: connected position that flips above, trigger width, repositions on scroll). `ui-option` / `ui-optgroup` add the visuals as host directives over `uiOption` / `uiOptionGroup`. `ui-select` wires a `role="combobox"` trigger to that listbox and adds the value model and forms contract. The same pieces build `ui-combobox`. **Why not `@angular/cdk/listbox`:** `CdkListbox` moves real DOM focus into the listbox, while the ARIA 1.2 combobox pattern keeps focus on the trigger or input and points at the active option with `aria-activedescendant`; its selection model is also tied to that focus handling. The listbox lives in the component\'s own view and is moved into the overlay with a `DomPortal`, so options, their ids and the key manager survive closing.',
  examples: [
    { title: 'Basic', component: SelectBasicExample, file: 'select-basic.example.ts', description: 'Named with `aria-labelledby` (or `aria-label`), which the select forwards to the trigger and the listbox. Try typing a letter while the select is closed: like a native `<select>`, it changes the value.' },
    { title: 'Groups and disabled options', component: SelectGroupsExample, file: 'select-groups.example.ts', description: '`ui-optgroup` renders a labelled `role="group"`; disabling a group disables its options. Options can hold arbitrary content — `label` sets the text used for the trigger and typeahead.' },
    { title: 'Multiple', component: SelectMultipleExample, file: 'select-multiple.example.ts', description: 'With `multiple`, `value` is an array, the listbox gets `aria-multiselectable` and Enter / Space toggle options without closing.' },
    { title: 'Reactive Forms with object values', component: SelectFormsExample, file: 'select-forms.example.ts', description: '`UiControlValueAccessor` connects `formControlName`; `compareWith` matches the saved copy to an option. Signal Forms `[formField]` works without the adapter.' },
  ],
  keyboard: [
    { keys: 'Enter / Space / ArrowDown / ArrowUp', action: 'Closed: opens the listbox and highlights the selected option (or the first one).' },
    { keys: 'Home / End', action: 'Closed: opens the listbox on the first / last option. Open: moves to the first / last option.' },
    { keys: 'Printable characters', action: 'Closed (single): selects the next option whose label starts with the typed text. Open: moves the highlight there.' },
    { keys: 'ArrowDown / ArrowUp', action: 'Open: moves the highlight, skipping disabled options (no wrap).' },
    { keys: 'PageDown / PageUp', action: 'Open: moves the highlight by 10 options.' },
    { keys: 'Enter / Space', action: 'Open: selects the highlighted option and closes (single), or toggles it and stays open (multiple).' },
    { keys: 'Alt + ArrowUp', action: 'Open: selects the highlighted option (single) and closes.' },
    { keys: 'Escape', action: 'Closes without changing the value.' },
    { keys: 'Tab', action: 'Closes without changing the value and moves focus on.' },
  ],
  a11y: [
    'Follows the WAI-ARIA APG **Select-Only Combobox** pattern: the trigger is a focusable `role="combobox"` element with `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls` and, while open, `aria-activedescendant` pointing at the highlighted `role="option"`. DOM focus never leaves the trigger, so screen readers stay in one place.',
    'Options expose `aria-selected` (and `aria-disabled`); groups are `role="group"` labelled by their visible heading. Disabled options stay visible and are skipped by the keyboard.',
    '`aria-label` / `aria-labelledby` / `aria-describedby` set on `ui-select` are moved to the trigger (and the name also to the listbox); the host element keeps no ARIA attributes. `invalid` sets `aria-invalid`, `required` sets `aria-required`.',
    'Clicking an option does not move focus (mousedown is prevented in the panel); clicking outside closes the panel. The highlighted option is scrolled into view.',
    '**Deviation from APG:** Tab closes without selecting the highlighted option — a stray Tab never changes the value.',
    '**Not supported:** a search box inside the panel (use `ui-combobox`), Shift + arrow range selection and Ctrl + A in multiple mode, a custom trigger template (the trigger shows option labels), virtual scrolling for very long lists.',
  ],
});
