import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiCalendar } from '@usertrv/ui/datepicker';

@Component({
  selector: 'docs-datepicker-inline-example',
  imports: [UiCalendar, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-row">
      <ui-calendar [(value)]="meeting" [dateFilter]="hasFreeSlots" />
      <p class="docs-muted" aria-live="polite">
        {{ meeting() ? 'Meeting on ' + (meeting() | date: 'longDate') : 'Pick a day with free slots.' }}
      </p>
    </div>
  `,
})
export class DatepickerInlineExample {
  protected readonly meeting = signal<Date | null>(null);

  /** Fully booked on Mondays and at weekends. */
  protected readonly hasFreeSlots = (date: Date) => ![0, 1, 6].includes(date.getDay());
}
