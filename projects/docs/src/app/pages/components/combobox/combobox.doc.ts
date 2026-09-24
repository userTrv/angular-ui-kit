import { defineDoc } from '../../../core/doc-model';
import { ComboboxAsyncExample } from './examples/combobox-async.example';
import { ComboboxObjectsExample } from './examples/combobox-objects.example';
import { ComboboxStaticExample } from './examples/combobox-static.example';

export const doc = defineDoc({
  slug: 'combobox',
  name: 'Combobox',
  category: 'Forms',
  summary: 'Autocomplete text input with a suggestions listbox: static filtering or debounced async search with loading, empty and error states.',
  entryPoint: '@usertrv/ui/combobox',
  api: ['UiCombobox', 'UiComboboxOptionTemplate', 'UiHighlight', 'UiComboboxSearch', 'UiComboboxSearchStatus', 'provideUiComboboxIntl', 'UiComboboxIntl'],
  layering:
    'Built from the same parts as `ui-select`: the headless `uiListbox` (from `@usertrv/ui/listbox`) in `uiListboxFocusMode="external"`, so the input keeps focus and forwards arrow keys to its `ActiveDescendantKeyManager`; `createListboxPopup()` for the CDK overlay; `ui-option` from `@usertrv/ui/select` for the visuals. On top, `ui-combobox` adds the text/value logic and the suggestion source: static `options` filtered by `filterWith`, or an async `search` function run through RxJS `switchMap` with a debounce, so a newer query cancels the previous request and aborts its `AbortSignal`.',
  examples: [
    { title: 'Static options', component: ComboboxStaticExample, file: 'combobox-static.example.ts', description: 'Options are filtered as you type (case-insensitive "contains") and the match is highlighted. Unmatched text reverts to the selected value on blur.' },
    { title: 'Async search', component: ComboboxAsyncExample, file: 'combobox-async.example.ts', description: 'A fake API with 400 ms latency. Type quickly and watch the counters: debounced keystrokes never start a request, and superseded requests are aborted. Turn on errors to see the error state. `ng-template uiComboboxOption` customises the option content.' },
    { title: 'Object values and Signal Forms', component: ComboboxObjectsExample, file: 'combobox-objects.example.ts', description: '`displayWith` turns the selected object into input text, `filterWith` also matches the team, `compareWith` marks the selected option. `[formField]` binds the value, `required` and the touched state natively.' },
  ],
  keyboard: [
    { keys: 'Typing', action: 'Filters (or searches) and opens the suggestions; nothing is highlighted until you press an arrow key.' },
    { keys: 'ArrowDown / ArrowUp', action: 'Closed: opens the suggestions on the first / last option (static options). Open: moves the highlight, wrapping around.' },
    { keys: 'Alt + ArrowDown', action: 'Opens the suggestions without highlighting an option.' },
    { keys: 'Alt + ArrowUp', action: 'Closes the suggestions.' },
    { keys: 'PageDown / PageUp', action: 'Open: moves the highlight by 10 options.' },
    { keys: 'Enter', action: 'Selects the highlighted option and closes. Without a highlight: accepts an exact label match, or the text itself with `freeText`.' },
    { keys: 'Escape', action: 'Closes the suggestions; when already closed, clears the text and the value.' },
    { keys: 'Tab', action: 'Closes the suggestions and moves focus on; unmatched text reverts to the selected value (unless `freeText`).' },
    { keys: 'Home / End / ArrowLeft / ArrowRight', action: 'Move the caret in the input (native behaviour).' },
  ],
  a11y: [
    'Follows the WAI-ARIA 1.2 **Combobox** pattern with **list autocomplete** (`aria-autocomplete="list"`): the `<input role="combobox">` keeps DOM focus, `aria-expanded` and `aria-controls` point at the `role="listbox"` popup, and `aria-activedescendant` names the highlighted option. There is no automatic selection of the first suggestion.',
    'Label it with a `<label for>` pointing at `inputId`, or with `aria-label` / `aria-labelledby`. The toggle button is `tabindex="-1"` (as in the APG example), so the combobox is a single tab stop.',
    'The number of suggestions is announced through the CDK `LiveAnnouncer` ("5 results available", "No results", the error text) because screen readers do not report listbox size changes while focus is in the input. Strings are translatable with `provideUiComboboxIntl()`.',
    'While a search runs the listbox has `aria-busy="true"` and the panel shows a "Searching…" row; the spinner in the input is decorative.',
    'Matching text is wrapped in `<mark>`; the option still has its full label as accessible name.',
    '**Not supported:** inline autocomplete (`aria-autocomplete="both"`), multiple selection / chips, grouped suggestions, virtual scrolling for very large result sets. `freeText` is meant for string values.',
  ],
});
