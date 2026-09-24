import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiDatepicker } from '@usertrv/ui/datepicker';

@Component({
  selector: 'docs-datepicker-basic-example',
  imports: [UiDatepicker, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-stack">
      <label for="invoice-due">Invoice due date</label>
      <ui-datepicker inputId="invoice-due" aria-describedby="invoice-due-hint" [(value)]="dueDate" />
      <span id="invoice-due-hint" class="docs-muted">Type a date or open the calendar.</span>
      <p class="docs-muted" aria-live="polite">
        {{ dueDate() ? 'Payment due ' + (dueDate() | date: 'fullDate') : 'No due date set' }}
      </p>
    </div>
  `,
})
export class DatepickerBasicExample {
  protected readonly dueDate = signal<Date | null>(new Date(2026, 9, 15));
}
