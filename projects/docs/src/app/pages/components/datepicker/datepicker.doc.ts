import { defineDoc } from '../../../core/doc-model';
import { DatepickerBasicExample } from './examples/datepicker-basic.example';
import { DatepickerConstraintsExample } from './examples/datepicker-constraints.example';
import { DatepickerInlineExample } from './examples/datepicker-inline.example';
import { DatepickerLocaleExample } from './examples/datepicker-locale.example';
import { DatepickerRangeExample } from './examples/datepicker-range.example';

export const doc = defineDoc({
  slug: 'datepicker',
  name: 'Datepicker',
  category: 'Forms',
  summary: 'Date and date-range fields with a keyboard-navigable calendar grid, locale-aware parsing and no date library.',
  entryPoint: '@usertrv/ui/datepicker',
  api: ['UiDatepicker', 'UiDateRangePicker', 'UiCalendar', 'provideUiDatepickerIntl'],
  layering:
    '`ui-calendar` is the reusable core: the grid, keyboard model and selection (single or range). `ui-datepicker` and `ui-date-range-picker` add typed input, parsing and a CDK overlay dialog around it. Date math is a small set of pure functions on plain local-midnight `Date`s built from year/month/day parts, so DST days never shift a date.',
  examples: [
    {
      title: 'Basic',
      component: DatepickerBasicExample,
      file: 'datepicker-basic.example.ts',
      description: 'Type a date in the locale format (here `MM/DD/YYYY`) or open the calendar. `inputId` connects a native `<label for>`.',
    },
    {
      title: 'Min, max and disabled days',
      component: DatepickerConstraintsExample,
      file: 'datepicker-constraints.example.ts',
      description: "Signal Forms' `minDate()` / `maxDate()` validate the value **and** are bound to the picker's `min` / `max`, which clamp calendar navigation. `dateFilter` disables weekends; they stay focusable but are `aria-disabled`.",
    },
    {
      title: 'Locales',
      component: DatepickerLocaleExample,
      file: 'datepicker-locale.example.ts',
      description: 'German weeks start on Monday, US weeks on Sunday, Egyptian weeks on Saturday (from `Intl.Locale#getWeekInfo`). Arabic uses Arabic-Indic digits in both display and typing, and a right-to-left layout where arrow keys are mirrored.',
    },
    {
      title: 'Date range',
      component: DatepickerRangeExample,
      file: 'datepicker-range.example.ts',
      description: 'Two inputs in one labelled group: each date is a separately named field and can be corrected on its own. In the calendar, the range is previewed on hover and while moving with the keyboard, and is committed only when both ends are chosen.',
    },
    {
      title: 'Inline calendar',
      component: DatepickerInlineExample,
      file: 'datepicker-inline.example.ts',
      description: '`ui-calendar` on its own, e.g. for a booking page. It also supports `selectionMode="range"` with a `[(range)]` model.',
    },
  ],
  keyboard: [
    { keys: 'Alt + ArrowDown', action: 'In the text input: opens the calendar.' },
    { keys: 'ArrowLeft / ArrowRight', action: 'Previous / next day (mirrored in right-to-left layouts). Crosses into the adjacent month.' },
    { keys: 'ArrowUp / ArrowDown', action: 'Same weekday in the previous / next week.' },
    { keys: 'Home / End', action: 'First / last day of the current week (locale week start).' },
    { keys: 'PageUp / PageDown', action: 'Same day in the previous / next month (clamped to the month length).' },
    { keys: 'Shift + PageUp / Shift + PageDown', action: 'Same day in the previous / next year.' },
    { keys: 'Enter / Space', action: 'Selects the focused day. In the popup this closes it and returns focus to the calendar button; in range mode the first press sets the start, the second the end.' },
    { keys: 'Escape', action: 'Closes the popup without changing the value and returns focus to the calendar button.' },
    { keys: 'Tab / Shift + Tab', action: 'Moves between the month/year buttons and the grid (one tab stop); focus is trapped inside the popup.' },
  ],
  a11y: [
    'Follows the WAI-ARIA APG **Date Picker Dialog** pattern: the toggle button has `aria-haspopup="dialog"` and `aria-expanded`, the popup is `role="dialog"` with `aria-modal="true"` and a label, focus moves into the grid on open and back to the button on close.',
    'The calendar is a `role="grid"` table labelled by the visible month heading, which is an `aria-live="polite"` region so month changes are announced. Column headers show short weekday names and expose the full names to screen readers.',
    'Days are `role="gridcell"` with a roving tabindex (a single tab stop), a full date as the accessible name (e.g. "Thursday, September 24, 2026"), `aria-selected`, `aria-current="date"` for today and `aria-disabled` for days excluded by `min` / `max` / `dateFilter`. Range mode sets `aria-multiselectable` and `aria-selected` on every day of the range.',
    'Invalid text, dates outside `min` / `max` and a range whose end is before its start set `aria-invalid` on the affected input; errors from Signal Forms are shown once the control is touched. Connect your error message with `aria-describedby`.',
    'Month and weekday names, digits and the typed format come from `Intl.DateTimeFormat`; the week start from `Intl.Locale#getWeekInfo` (with a small CLDR fallback table). Button labels such as "Previous month" are translated with `provideUiDatepickerIntl()`.',
    '**Not supported:** time of day and time zones (values are local-midnight dates), non-Gregorian calendars (`ja-JP-u-ca-japanese` etc.), month/year picker views, typing month names ("24 Sep 2026") — only the numeric format is parsed, two-digit years always map to 2000–2099.',
  ],
});
