import { UiWeekday, addDays, addMonths, addYears, endOfWeek, startOfWeek } from './date-utils';

/** Context needed to translate a key press into a date move. */
export interface UiCalendarKeyContext {
  firstDayOfWeek: UiWeekday;
  /** Right-to-left layout: ArrowLeft moves forward in time. */
  rtl: boolean;
}

/**
 * Maps a keydown in the calendar grid to the date that should receive focus, following the
 * WAI-ARIA APG "Date Picker Dialog" grid keyboard contract. Returns `null` for keys the grid
 * does not handle. Bounds (`min`/`max`) are applied by the caller.
 */
export function dateForKey(event: KeyboardEvent, date: Date, ctx: UiCalendarKeyContext): Date | null {
  const forward = ctx.rtl ? -1 : 1;
  switch (event.key) {
    case 'ArrowRight':
      return addDays(date, forward);
    case 'ArrowLeft':
      return addDays(date, -forward);
    case 'ArrowDown':
      return addDays(date, 7);
    case 'ArrowUp':
      return addDays(date, -7);
    case 'Home':
      return startOfWeek(date, ctx.firstDayOfWeek);
    case 'End':
      return endOfWeek(date, ctx.firstDayOfWeek);
    case 'PageUp':
      return event.shiftKey ? addYears(date, -1) : addMonths(date, -1);
    case 'PageDown':
      return event.shiftKey ? addYears(date, 1) : addMonths(date, 1);
    default:
      return null;
  }
}
