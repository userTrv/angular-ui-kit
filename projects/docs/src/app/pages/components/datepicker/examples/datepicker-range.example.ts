import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { UiDateRange, UiDateRangePicker } from '@usertrv/ui/datepicker';

const DAY_MS = 24 * 60 * 60 * 1000;

@Component({
  selector: 'docs-datepicker-range-example',
  imports: [UiDateRangePicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-stack">
      <span id="stay-label">Stay</span>
      <ui-date-range-picker aria-labelledby="stay-label" [minDate]="today" [(value)]="stay" />
      <p class="docs-muted" aria-live="polite">{{ summary() }}</p>
    </div>
  `,
})
export class DatepickerRangeExample {
  protected readonly today = new Date(new Date().setHours(0, 0, 0, 0));
  protected readonly stay = signal<UiDateRange>({ start: null, end: null });

  protected readonly summary = computed(() => {
    const { start, end } = this.stay();
    if (!start || !end) return 'Pick check-in and check-out.';
    const nights = Math.round((end.getTime() - start.getTime()) / DAY_MS);
    return nights > 0 ? `${nights} night${nights === 1 ? '' : 's'}` : 'Check-out must be after check-in.';
  });
}
