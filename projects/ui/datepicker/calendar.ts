import { Directionality } from '@angular/cdk/bidi';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  LOCALE_ID,
  ViewEncapsulation,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
} from '@angular/core';
import { injectId } from '@usertrv/ui/a11y';
import { dateForKey } from './calendar-keys';
import { getFirstDayOfWeek, getWeekdayNames } from './date-locale';
import {
  UiDateRange,
  UiWeekday,
  addMonths,
  clampDate,
  compareDays,
  endOfMonth,
  isInRange,
  isSameDay,
  isWithinBounds,
  monthWeeks,
  startOfDay,
  startOfMonth,
  today,
} from './date-utils';
import { UI_DATEPICKER_INTL } from './datepicker-intl';

/** Whether the calendar picks one day or a start/end range. */
export type UiCalendarSelectionMode = 'single' | 'range';

/** Predicate deciding whether a day can be selected (e.g. no weekends). */
export type UiDateFilter = (date: Date) => boolean;

interface CalendarCell {
  date: Date;
  text: string;
  label: string;
  active: boolean;
  today: boolean;
  disabled: boolean;
  selected: boolean;
  rangeStart: boolean;
  rangeEnd: boolean;
  preview: boolean;
}

/**
 * A month calendar following the WAI-ARIA APG "Date Picker Dialog" grid: a `role="grid"`
 * table with one tab stop (roving tabindex on the active day), full keyboard navigation across
 * month and year boundaries, `min`/`max` clamping and a `dateFilter`. Works inline or inside the
 * `ui-datepicker` / `ui-date-range-picker` popups. Dates are plain local-midnight `Date`s.
 */
@Component({
  selector: 'ui-calendar',
  exportAs: 'uiCalendar',
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-calendar',
    '[class.ui-calendar--range]': 'selectionMode() === "range"',
  },
})
export class UiCalendar {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly dir = inject(Directionality, { optional: true });
  protected readonly intl = inject(UI_DATEPICKER_INTL);
  protected readonly titleId = injectId('ui-calendar-title');

  /** `single` selects one day into `value`; `range` selects a start and end into `range`. */
  readonly selectionMode = input<UiCalendarSelectionMode>('single');
  /** Selected day in `single` mode. */
  readonly value = model<Date | null>(null);
  /** Selected range in `range` mode. */
  readonly range = model<UiDateRange>({ start: null, end: null });
  /** Earliest selectable day (inclusive). Navigation is clamped to it. */
  readonly min = input<Date | null | undefined>(null);
  /** Latest selectable day (inclusive). Navigation is clamped to it. */
  readonly max = input<Date | null | undefined>(null);
  /** Days for which this returns `false` are shown and focusable but `aria-disabled`. */
  readonly dateFilter = input<UiDateFilter | null>(null);
  /** BCP 47 locale for month/weekday names and digits. Defaults to Angular's `LOCALE_ID`. */
  readonly locale = input<string>(inject(LOCALE_ID));
  /** First column of the grid (0 = Sunday). Defaults to the locale's week start. */
  readonly firstDayOfWeek = input<UiWeekday | null | undefined>(null);
  /** Day to show and focus when nothing is selected. Defaults to today. */
  readonly startAt = input<Date | null>(null);

  /** Emits every day the user picks (click, Enter or Space). */
  readonly dateSelected = output<Date>();
  /** Emits when the user completes a range (in `range` mode). */
  readonly rangeSelected = output<UiDateRange>();

  /** The day that holds the grid's tab stop; its month is the visible month. */
  protected readonly activeDate = linkedSignal(() => {
    const anchor = this.selectionMode() === 'range' ? this.currentRange().start : this.value();
    return clampDate(startOfDay(anchor ?? this.startAt() ?? today()), this.min(), this.max());
  });

  /** `range` with a `null` binding read as an empty range. */
  private readonly currentRange = computed<UiDateRange>(() => this.range() ?? { start: null, end: null });
  private readonly hoverDate = signal<Date | null>(null);
  private readonly gridFocused = signal(false);

  protected readonly firstDay = computed(() => this.firstDayOfWeek() ?? getFirstDayOfWeek(this.locale()));
  protected readonly weekdays = computed(() => getWeekdayNames(this.locale(), this.firstDay()));
  protected readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric' }).format(this.activeDate()),
  );

  protected readonly weeks = computed<(CalendarCell | null)[][]>(() => {
    const active = this.activeDate();
    const locale = this.locale();
    const dayText = new Intl.NumberFormat(locale, { useGrouping: false });
    const fullDate = new Intl.DateTimeFormat(locale, { dateStyle: 'full' });
    const now = today();
    const isRange = this.selectionMode() === 'range';
    const { start, end } = this.currentRange();
    const previewEnd = isRange && start && !end ? (this.hoverDate() ?? (this.gridFocused() ? active : null)) : null;
    return monthWeeks(active.getFullYear(), active.getMonth(), this.firstDay()).map((week) =>
      week.map((date) => {
        if (!date) return null;
        return {
          date,
          text: dayText.format(date.getDate()),
          label: fullDate.format(date),
          active: isSameDay(date, active),
          today: isSameDay(date, now),
          disabled: !this.isSelectable(date),
          selected: isRange ? isSameDay(date, start) || isInRange(date, start, end) : isSameDay(date, this.value()),
          rangeStart: isRange && isSameDay(date, start),
          // A lone start (no end, no preview) is rounded on both sides.
          rangeEnd: isRange && (isSameDay(date, end) || (!end && !previewEnd && isSameDay(date, start))),
          preview: !!previewEnd && isInRange(date, start, previewEnd),
        };
      }),
    );
  });

  protected readonly canGoBack = computed(() => this.canShow(-1));
  protected readonly canGoForward = computed(() => this.canShow(1));
  protected readonly canGoBackYear = computed(() => this.canShow(-12));
  protected readonly canGoForwardYear = computed(() => this.canShow(12));

  /** Moves keyboard focus to the active day (e.g. when a popup opens). */
  focusActiveCell(): void {
    this.host.querySelector<HTMLElement>('.ui-calendar__cell[tabindex="0"]')?.focus();
  }

  /** True when `date` is inside `min`/`max` and passes `dateFilter`. */
  isSelectable(date: Date): boolean {
    const filter = this.dateFilter();
    return isWithinBounds(date, this.min(), this.max()) && (!filter || filter(date));
  }

  protected navigate(months: number): void {
    if (!this.canShow(months)) return;
    this.activeDate.set(clampDate(addMonths(this.activeDate(), months), this.min(), this.max()));
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.select(this.activeDate());
      return;
    }
    const next = dateForKey(event, this.activeDate(), { firstDayOfWeek: this.firstDay(), rtl: this.dir?.value === 'rtl' });
    if (!next) return;
    event.preventDefault();
    this.hoverDate.set(null);
    this.activeDate.set(clampDate(next, this.min(), this.max()));
    afterNextRender({ write: () => this.focusActiveCell() }, { injector: this.injector });
  }

  protected select(date: Date): void {
    if (!this.isSelectable(date)) return;
    this.activeDate.set(date);
    if (this.selectionMode() === 'single') {
      this.value.set(date);
    } else {
      const { start, end } = this.currentRange();
      if (!start || end || compareDays(date, start) < 0) {
        this.range.set({ start: date, end: null });
      } else {
        const completed = { start, end: date };
        this.range.set(completed);
        this.rangeSelected.emit(completed);
      }
    }
    this.dateSelected.emit(date);
  }

  protected onCellHover(date: Date | null): void {
    this.hoverDate.set(date);
  }

  protected onGridFocus(focused: boolean): void {
    this.gridFocused.set(focused);
  }

  /** Whether any day of the month `months` away from the visible one is within bounds. */
  private canShow(months: number): boolean {
    const target = addMonths(startOfMonth(this.activeDate()), months);
    const min = this.min();
    const max = this.max();
    return (!min || compareDays(endOfMonth(target), min) >= 0) && (!max || compareDays(target, max) <= 0);
  }
}
